import type {
  AppEvent,
  AppEventType,
  AuthMethod,
  DiscoveredApp,
  InventorySummary,
  OAuthGrant,
  PageAuthSignal,
} from './types';
import { lookupCatalog, registrableDomain } from './catalog';
import { computeRisk } from './risk';
import { addEvent, getAllApps, getApp, putApp } from './db';

// ─────────────────────────────────────────────────────────────
// Inventory aggregation — the brain that turns raw browser signals
// (visits, auth signals, OAuth grants) into a scored app inventory.
// ─────────────────────────────────────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function freshApp(id: string, hostname: string): DiscoveredApp {
  const entry = lookupCatalog(hostname);
  const now = Date.now();
  return {
    id,
    name: entry?.name ?? registrableDomain(hostname),
    domain: registrableDomain(hostname),
    category: entry?.category ?? 'other',
    inCatalog: !!entry,
    sensitivity: entry?.sensitivity ?? 'medium',
    ssoSupported: entry?.ssoSupported ?? false,
    ssoTax: entry?.ssoTax ?? false,
    firstSeen: now,
    lastSeen: now,
    visitCount: 0,
    authMethods: [],
    oauthGrants: [],
    riskScore: 0,
    riskTier: 'low',
    riskFactors: [],
  };
}

function appIdFor(hostname: string): string {
  return lookupCatalog(hostname)?.id ?? registrableDomain(hostname);
}

function rescore(app: DiscoveredApp): DiscoveredApp {
  const { score, tier, factors } = computeRisk(app);
  app.riskScore = score;
  app.riskTier = tier;
  app.riskFactors = factors;
  return app;
}

async function logEvent(appId: string, type: AppEventType, detail: string): Promise<void> {
  const event: AppEvent = {
    id: crypto.randomUUID(),
    appId,
    type,
    detail,
    at: Date.now(),
  };
  await addEvent(event);
}

/** A tab navigated to a domain — count it as a visit. */
export async function recordVisit(hostname: string): Promise<void> {
  const id = appIdFor(hostname);
  let app = await getApp(id);
  const isNew = !app;
  if (!app) app = freshApp(id, hostname);

  app.visitCount += 1;
  app.lastSeen = Date.now();
  await putApp(rescore(app));

  if (isNew) {
    await logEvent(id, 'discovered', `First seen — ${app.name}`);
  } else {
    await logEvent(id, 'visit', `Opened ${app.name}`);
  }
}

/** A content script reported the auth surface of a page. */
export async function recordAuthSignal(signal: PageAuthSignal): Promise<void> {
  if (signal.authMethods.length === 0 && !signal.hasPasswordField) return;
  const id = appIdFor(signal.hostname);
  let app = await getApp(id);
  const isNew = !app;
  if (!app) app = freshApp(id, signal.hostname);

  const before = new Set(app.authMethods);
  const merged = new Set<AuthMethod>([...app.authMethods, ...signal.authMethods]);
  if (signal.hasPasswordField) merged.add('password');
  app.authMethods = [...merged];
  app.lastSeen = Date.now();
  await putApp(rescore(app));

  if (isNew) await logEvent(id, 'discovered', `First seen — ${app.name}`);
  const added = [...merged].filter((m) => !before.has(m));
  if (added.includes('sso-saml')) {
    await logEvent(id, 'sso-detected', `SSO sign-in option detected on ${app.name}`);
  } else if (added.length > 0) {
    await logEvent(id, 'login-page', `Auth surface seen: ${added.join(', ')}`);
  }
}

/** An OAuth consent flow was observed against a corporate IdP. */
export async function recordOAuthGrant(grant: OAuthGrant): Promise<void> {
  // Attribute the grant to the app that requested it.
  const host = grant.redirectHost || grant.requestingApp;
  const id = appIdFor(host);
  let app = await getApp(id);
  const isNew = !app;
  if (!app) app = freshApp(id, host);

  // Dedupe: same provider + same scope set within the last hour.
  const key = grant.provider + '|' + grant.scopes.slice().sort().join(',');
  const seen = app.oauthGrants.some(
    (g) => g.provider + '|' + g.scopes.slice().sort().join(',') === key,
  );
  if (!seen) {
    app.oauthGrants.push(grant);
    app.lastSeen = Date.now();
    await putApp(rescore(app));
    if (isNew) await logEvent(id, 'discovered', `First seen — ${app.name}`);
    await logEvent(
      id,
      'oauth-grant',
      `OAuth grant via ${grant.provider} · ${grant.scopes.length} scope(s)` +
        (grant.sensitiveScopes.length ? ` · ${grant.sensitiveScopes.length} broad` : ''),
    );
  } else {
    app.lastSeen = Date.now();
    await putApp(app);
  }
}

/** Roll the whole inventory up into headline numbers. */
export async function summarize(): Promise<InventorySummary> {
  const apps = await getAllApps();
  const now = Date.now();
  let high = 0;
  let medium = 0;
  let low = 0;
  let unmanaged = 0;
  let oauthGrants = 0;
  let ssoTaxApps = 0;
  let newThisWeek = 0;
  let lastScanAt: number | null = null;

  for (const app of apps) {
    if (app.riskTier === 'high') high++;
    else if (app.riskTier === 'medium') medium++;
    else low++;
    if (!app.inCatalog) unmanaged++;
    oauthGrants += app.oauthGrants.length;
    if (app.ssoTax) ssoTaxApps++;
    if (now - app.firstSeen < WEEK_MS) newThisWeek++;
    if (lastScanAt === null || app.lastSeen > lastScanAt) lastScanAt = app.lastSeen;
  }

  return {
    totalApps: apps.length,
    highRisk: high,
    mediumRisk: medium,
    lowRisk: low,
    unmanaged,
    oauthGrants,
    ssoTaxApps,
    newThisWeek,
    lastScanAt,
  };
}
