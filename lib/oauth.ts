import type { IdentityProvider, OAuthGrant } from './types';
import { lookupCatalog, registrableDomain } from './catalog';

// ─────────────────────────────────────────────────────────────
// Detects OAuth consent flows against corporate identity
// providers. A consent screen URL carries client_id / redirect_uri
// / scope — enough to say "App X just asked for Y access to your
// Google/Microsoft/GitHub account."
// ─────────────────────────────────────────────────────────────

interface ProviderMatcher {
  provider: IdentityProvider;
  /** Returns true when the URL is that provider's OAuth authorize endpoint. */
  test: (u: URL) => boolean;
}

const PROVIDERS: ProviderMatcher[] = [
  {
    provider: 'google',
    test: (u) =>
      u.hostname === 'accounts.google.com' &&
      /\/o\/oauth2\/(v2\/)?auth|\/signin\/oauth/.test(u.pathname),
  },
  {
    provider: 'microsoft',
    test: (u) =>
      (u.hostname === 'login.microsoftonline.com' && /\/oauth2\//.test(u.pathname) && /authorize/.test(u.pathname)) ||
      (u.hostname === 'login.live.com' && u.pathname.startsWith('/oauth20_authorize')),
  },
  {
    provider: 'github',
    test: (u) => u.hostname === 'github.com' && u.pathname === '/login/oauth/authorize',
  },
  {
    provider: 'apple',
    test: (u) => u.hostname === 'appleid.apple.com' && u.pathname.startsWith('/auth/authorize'),
  },
  {
    provider: 'okta',
    test: (u) => /\.okta\.com$/.test(u.hostname) && /\/oauth2\/.*\/authorize/.test(u.pathname),
  },
];

/** Google API scopes considered broad / high-impact. */
const SENSITIVE_SCOPE_PATTERNS = [
  /drive(?!\.appdata)/i,
  /gmail|mail\.(read|send|modify)/i,
  /calendar/i,
  /contacts|directory/i,
  /spreadsheets/i,
  /\buser\b|userinfo\.email/i,
  // Microsoft Graph
  /Mail\.|Files\.|Directory\.|User\.Read\.All|Sites\.|offline_access/i,
  // GitHub
  /^repo$|admin:|write:|read:org|delete_repo/i,
];

function isSensitiveScope(scope: string): boolean {
  return SENSITIVE_SCOPE_PATTERNS.some((re) => re.test(scope));
}

/** Human-friendly app name from a redirect_uri host. */
function appNameFromHost(host: string): string {
  const entry = lookupCatalog(host);
  if (entry) return entry.name;
  const reg = registrableDomain(host);
  const base = reg.split('.')[0] || reg;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Parse an OAuth authorize URL into a grant record, or null if the
 * URL is not a recognised consent endpoint.
 */
export function parseOAuthGrant(rawUrl: string): OAuthGrant | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  const match = PROVIDERS.find((p) => p.test(u));
  if (!match) return null;

  const clientId = u.searchParams.get('client_id') ?? '';
  const redirectUri = u.searchParams.get('redirect_uri') ?? '';
  const rawScope = u.searchParams.get('scope') ?? '';
  // Scopes are space-delimited (occasionally comma, e.g. GitHub).
  const scopes = rawScope
    .split(/[\s,+]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let redirectHost = '';
  try {
    redirectHost = redirectUri ? new URL(redirectUri).hostname : '';
  } catch {
    redirectHost = '';
  }

  // Identify the requesting app: prefer the redirect host, fall back
  // to nothing useful (an opaque client_id alone isn't attributable).
  const requestingApp = redirectHost
    ? appNameFromHost(redirectHost)
    : 'Unknown application';

  return {
    provider: match.provider,
    requestingApp,
    redirectHost,
    clientId,
    scopes,
    sensitiveScopes: scopes.filter(isSensitiveScope),
    detectedAt: Date.now(),
  };
}

/** Short, readable label for a scope string. */
export function prettyScope(scope: string): string {
  return scope
    .replace(/^https:\/\/www\.googleapis\.com\/auth\//, '')
    .replace(/^https:\/\/graph\.microsoft\.com\//, '');
}
