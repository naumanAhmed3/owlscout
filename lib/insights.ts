import type { DiscoveredApp } from './types';

// ─────────────────────────────────────────────────────────────
// Turns the raw inventory into prioritised, actionable reviews —
// the "what should I actually do" layer on top of the numbers.
// ─────────────────────────────────────────────────────────────

export type InsightId = 'high-risk' | 'oauth-broad' | 'sso-gap' | 'unmanaged';

export type InsightSeverity = 'high' | 'medium';

export interface Insight {
  id: InsightId;
  severity: InsightSeverity;
  count: number;
  title: string;
  detail: string;
}

/** Does an app fall under a given insight? Also drives table filtering. */
export function appMatchesInsight(app: DiscoveredApp, id: InsightId): boolean {
  switch (id) {
    case 'high-risk':
      return app.riskTier === 'high';
    case 'oauth-broad':
      return app.oauthGrants.some((g) => g.sensitiveScopes.length > 0);
    case 'sso-gap':
      return (
        app.ssoSupported &&
        app.authMethods.includes('password') &&
        !app.authMethods.includes('sso-saml')
      );
    case 'unmanaged':
      return !app.inCatalog;
  }
}

const DEFINITIONS: Omit<Insight, 'count'>[] = [
  {
    id: 'high-risk',
    severity: 'high',
    title: 'High-risk apps',
    detail: 'Scored above 64 — review who has access and who owns them.',
  },
  {
    id: 'oauth-broad',
    severity: 'high',
    title: 'Broad OAuth grants',
    detail:
      'Hold sensitive scopes — Drive, Mail, repos — against corporate identity.',
  },
  {
    id: 'sso-gap',
    severity: 'medium',
    title: 'SSO gaps',
    detail: 'Accessed with a password even though the vendor supports SSO.',
  },
  {
    id: 'unmanaged',
    severity: 'medium',
    title: 'Unmanaged apps',
    detail: 'Discovered in the browser but absent from any managed catalog.',
  },
];

/** Build the insight list, dropping any with nothing to act on. */
export function buildInsights(apps: DiscoveredApp[]): Insight[] {
  return DEFINITIONS.map((def) => ({
    ...def,
    count: apps.filter((a) => appMatchesInsight(a, def.id)).length,
  })).filter((i) => i.count > 0);
}
