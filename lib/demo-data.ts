import type { AppEvent, AuthMethod, DiscoveredApp, OAuthGrant } from './types';
import { CATALOG, registrableDomain } from './catalog';
import { computeRisk } from './risk';

// ─────────────────────────────────────────────────────────────
// Realistic seeded inventory — powers the hosted dashboard demo
// and the "Load sample data" button. Mirrors what a real
// mid-size company's browser footprint looks like.
// ─────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

interface Seed {
  catalogId?: string;
  domain?: string;
  name?: string;
  daysAgoFirst: number;
  visitCount: number;
  authMethods: AuthMethod[];
  oauth?: Array<Omit<OAuthGrant, 'detectedAt'> & { daysAgo: number }>;
}

const SEEDS: Seed[] = [
  { catalogId: 'github', daysAgoFirst: 41, visitCount: 318, authMethods: ['sso-saml'] },
  { catalogId: 'slack', daysAgoFirst: 41, visitCount: 402, authMethods: ['sso-saml'] },
  { catalogId: 'linear', daysAgoFirst: 39, visitCount: 211, authMethods: ['google-oauth'] },
  { catalogId: 'figma', daysAgoFirst: 38, visitCount: 96, authMethods: ['google-oauth'] },
  {
    catalogId: 'notion',
    daysAgoFirst: 37,
    visitCount: 140,
    authMethods: ['password', 'google-oauth'],
    oauth: [
      {
        provider: 'google',
        requestingApp: 'Notion',
        redirectHost: 'notion.so',
        clientId: '5648...apps.googleusercontent.com',
        scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file'],
        sensitiveScopes: ['https://www.googleapis.com/auth/drive.file'],
        daysAgo: 37,
      },
    ],
  },
  { catalogId: 'datadog', daysAgoFirst: 33, visitCount: 88, authMethods: ['sso-saml'] },
  { catalogId: 'vercel', daysAgoFirst: 33, visitCount: 64, authMethods: ['github-oauth'] },
  { catalogId: 'sentry', daysAgoFirst: 30, visitCount: 51, authMethods: ['github-oauth'] },
  {
    catalogId: 'salesforce',
    daysAgoFirst: 28,
    visitCount: 73,
    authMethods: ['sso-saml'],
  },
  { catalogId: 'hubspot', daysAgoFirst: 24, visitCount: 39, authMethods: ['password'] },
  {
    catalogId: 'openai',
    daysAgoFirst: 22,
    visitCount: 130,
    authMethods: ['password', 'google-oauth'],
  },
  { catalogId: 'anthropic', daysAgoFirst: 20, visitCount: 117, authMethods: ['google-oauth'] },
  { catalogId: 'airtable', daysAgoFirst: 19, visitCount: 44, authMethods: ['password'] },
  { catalogId: 'zoom', daysAgoFirst: 17, visitCount: 58, authMethods: ['sso-saml'] },
  { catalogId: 'bamboohr', daysAgoFirst: 14, visitCount: 22, authMethods: ['sso-saml'] },
  { catalogId: 'onepassword', daysAgoFirst: 12, visitCount: 70, authMethods: ['sso-saml'] },
  // ── Shadow IT — unmanaged self-signups ──
  {
    domain: 'lovable.dev',
    name: 'Lovable',
    daysAgoFirst: 6,
    visitCount: 14,
    authMethods: ['github-oauth'],
    oauth: [
      {
        provider: 'github',
        requestingApp: 'Lovable',
        redirectHost: 'lovable.dev',
        clientId: 'Iv1.9c2f...',
        scopes: ['repo', 'read:org', 'user:email'],
        sensitiveScopes: ['repo', 'read:org'],
        daysAgo: 6,
      },
    ],
  },
  {
    domain: 'gamma.app',
    name: 'Gamma',
    daysAgoFirst: 5,
    visitCount: 9,
    authMethods: ['google-oauth'],
    oauth: [
      {
        provider: 'google',
        requestingApp: 'Gamma',
        redirectHost: 'gamma.app',
        clientId: '7781...apps.googleusercontent.com',
        scopes: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/presentations',
        ],
        sensitiveScopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/presentations',
        ],
        daysAgo: 5,
      },
    ],
  },
  {
    domain: 'granola.ai',
    name: 'Granola',
    daysAgoFirst: 4,
    visitCount: 11,
    authMethods: ['google-oauth'],
    oauth: [
      {
        provider: 'google',
        requestingApp: 'Granola',
        redirectHost: 'granola.ai',
        clientId: '3392...apps.googleusercontent.com',
        scopes: [
          'openid',
          'email',
          'https://www.googleapis.com/auth/calendar.readonly',
        ],
        sensitiveScopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        daysAgo: 4,
      },
    ],
  },
  {
    domain: 'typedream.com',
    name: 'Typedream',
    daysAgoFirst: 3,
    visitCount: 4,
    authMethods: ['password'],
  },
];

const EVENT_TEMPLATES = (app: DiscoveredApp): AppEvent[] => {
  const events: AppEvent[] = [];
  events.push({
    id: crypto.randomUUID(),
    appId: app.id,
    type: 'discovered',
    detail: `First seen — ${app.name}`,
    at: app.firstSeen,
  });
  for (const grant of app.oauthGrants) {
    events.push({
      id: crypto.randomUUID(),
      appId: app.id,
      type: 'oauth-grant',
      detail: `OAuth grant via ${grant.provider} · ${grant.scopes.length} scope(s)${
        grant.sensitiveScopes.length ? ` · ${grant.sensitiveScopes.length} broad` : ''
      }`,
      at: grant.detectedAt,
    });
  }
  if (app.authMethods.includes('sso-saml')) {
    events.push({
      id: crypto.randomUUID(),
      appId: app.id,
      type: 'sso-detected',
      detail: `SSO sign-in option detected on ${app.name}`,
      at: app.firstSeen + DAY,
    });
  }
  events.push({
    id: crypto.randomUUID(),
    appId: app.id,
    type: 'visit',
    detail: `Opened ${app.name}`,
    at: app.lastSeen,
  });
  return events;
};

export function buildDemoData(): { apps: DiscoveredApp[]; events: AppEvent[] } {
  const apps: DiscoveredApp[] = [];
  const events: AppEvent[] = [];

  for (const seed of SEEDS) {
    const entry = seed.catalogId
      ? CATALOG.find((c) => c.id === seed.catalogId)
      : undefined;
    const domain = entry?.domains[0] ?? seed.domain;
    if (!domain) continue; // misconfigured seed — skip rather than crash
    const id = entry?.id ?? registrableDomain(domain);
    const firstSeen = now - seed.daysAgoFirst * DAY;
    const lastSeen = now - Math.floor(Math.random() * 2 * DAY);

    const oauthGrants: OAuthGrant[] = (seed.oauth ?? []).map((g) => ({
      provider: g.provider,
      requestingApp: g.requestingApp,
      redirectHost: g.redirectHost,
      clientId: g.clientId,
      scopes: g.scopes,
      sensitiveScopes: g.sensitiveScopes,
      detectedAt: now - g.daysAgo * DAY,
    }));

    const app: DiscoveredApp = {
      id,
      name: entry?.name ?? seed.name ?? registrableDomain(domain),
      domain: registrableDomain(domain),
      category: entry?.category ?? 'ai-ml',
      inCatalog: !!entry,
      sensitivity: entry?.sensitivity ?? 'high',
      ssoSupported: entry?.ssoSupported ?? false,
      ssoTax: entry?.ssoTax ?? false,
      firstSeen,
      lastSeen,
      visitCount: seed.visitCount,
      authMethods: seed.authMethods,
      oauthGrants,
      riskScore: 0,
      riskTier: 'low',
      riskFactors: [],
    };
    const risk = computeRisk(app);
    app.riskScore = risk.score;
    app.riskTier = risk.tier;
    app.riskFactors = risk.factors;

    apps.push(app);
    events.push(...EVENT_TEMPLATES(app));
  }

  events.sort((a, b) => b.at - a.at);
  return { apps, events };
}
