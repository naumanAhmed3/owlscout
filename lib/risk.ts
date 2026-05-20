import type { DiscoveredApp, RiskTier } from './types';

// ─────────────────────────────────────────────────────────────
// Shadow-IT risk scoring. Deliberately explainable: every point
// added carries a human-readable factor so the dashboard can show
// *why* an app scored the way it did.
// ─────────────────────────────────────────────────────────────

const SENSITIVITY_BASE: Record<DiscoveredApp['sensitivity'], number> = {
  high: 40,
  medium: 22,
  low: 10,
};

export interface RiskResult {
  score: number;
  tier: RiskTier;
  factors: string[];
}

export function tierFor(score: number): RiskTier {
  if (score > 64) return 'high';
  if (score >= 34) return 'medium';
  return 'low';
}

/**
 * Score a discovered app 0–100. Pure function of the app record so
 * it can be re-run cheaply whenever the inventory changes.
 */
export function computeRisk(
  app: Pick<
    DiscoveredApp,
    'sensitivity' | 'inCatalog' | 'ssoSupported' | 'ssoTax' | 'authMethods' | 'oauthGrants' | 'category'
  >,
): RiskResult {
  let score = SENSITIVITY_BASE[app.sensitivity];
  const factors: string[] = [
    `${app.sensitivity[0].toUpperCase() + app.sensitivity.slice(1)}-sensitivity ${app.category.replace('-', ' / ')} app`,
  ];

  if (!app.inCatalog) {
    score += 18;
    factors.push('Unrecognised app — not in the managed catalog');
  }

  // OAuth exposure against corporate identity.
  let oauthPoints = 0;
  for (const grant of app.oauthGrants) {
    if (grant.sensitiveScopes.length > 0) {
      oauthPoints += 8 + Math.min(3 * (grant.sensitiveScopes.length - 1), 18);
    }
  }
  if (oauthPoints > 0) {
    oauthPoints = Math.min(oauthPoints, 30);
    score += oauthPoints;
    const totalSensitive = app.oauthGrants.reduce((n, g) => n + g.sensitiveScopes.length, 0);
    factors.push(
      `Holds an OAuth grant with ${totalSensitive} broad scope${totalSensitive === 1 ? '' : 's'} on corporate identity`,
    );
  }

  // SSO available but the user signed in with a password anyway.
  const usedSso = app.authMethods.includes('sso-saml');
  const usedPassword = app.authMethods.includes('password');
  if (app.ssoSupported && usedPassword && !usedSso) {
    score += 16;
    factors.push('SSO is available but the account was accessed with a password');
  }

  if (app.ssoTax) {
    score += 6;
    factors.push('Vendor gates SSO behind a pricier tier (the “SSO tax”)');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, tier: tierFor(score), factors };
}
