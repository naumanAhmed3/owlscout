import type { IdentityProvider, OAuthGrant } from './types';
import { lookupCatalog, registrableDomain } from './catalog';

// ─────────────────────────────────────────────────────────────
// Detects OAuth / federated sign-in flows against corporate
// identity providers. Rather than match exact authorize paths
// (which drift — Google alone has /o/oauth2/v2/auth, /signin/oauth,
// /gsi/...), we key off the reliable signal: an IdP host carrying a
// `client_id` query parameter. That is an OAuth flow, full stop.
// ─────────────────────────────────────────────────────────────

const IDP_HOSTS: Record<string, IdentityProvider> = {
  'accounts.google.com': 'google',
  'oauth2.googleapis.com': 'google',
  'login.microsoftonline.com': 'microsoft',
  'login.live.com': 'microsoft',
  'login.microsoft.com': 'microsoft',
  'github.com': 'github',
  'appleid.apple.com': 'apple',
};

/** Identify the IdP for a hostname, if any. */
export function identityProviderFor(hostname: string): IdentityProvider | null {
  if (IDP_HOSTS[hostname]) return IDP_HOSTS[hostname];
  if (/\.okta\.com$/.test(hostname)) return 'okta';
  return null;
}

/** Broad / high-impact scope patterns across providers. */
const SENSITIVE_SCOPE_PATTERNS = [
  /drive(?!\.appdata)/i,
  /gmail|mail\.(read|send|modify)/i,
  /calendar/i,
  /contacts|directory/i,
  /spreadsheets|documents|presentations/i,
  /Mail\.|Files\.|Directory\.|Sites\.|User\.Read\.All|offline_access/i,
  /^repo$|^admin:|^write:|^delete_repo$|read:org/i,
];

function isSensitiveScope(scope: string): boolean {
  return SENSITIVE_SCOPE_PATTERNS.some((re) => re.test(scope));
}

function appNameFromHost(host: string): string {
  const entry = lookupCatalog(host);
  if (entry) return entry.name;
  const reg = registrableDomain(host);
  const base = reg.split('.')[0] || reg;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Parse an OAuth / sign-in URL into a grant record, or null if the URL
 * is not a recognised IdP consent flow.
 */
export function parseOAuthGrant(rawUrl: string): OAuthGrant | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  const provider = identityProviderFor(u.hostname);
  if (!provider) return null;

  // github.com is also a normal site — only its authorize path counts.
  if (provider === 'github' && !u.pathname.startsWith('/login/oauth/')) {
    return null;
  }

  const clientId = u.searchParams.get('client_id') ?? '';
  // Every OAuth / federated sign-in flow carries a client_id. Without
  // one, this is just the user browsing the IdP — ignore it.
  if (!clientId) return null;

  const rawScope =
    u.searchParams.get('scope') ?? u.searchParams.get('scopes') ?? '';
  const scopes = rawScope
    .split(/[\s,+]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const redirectUri =
    u.searchParams.get('redirect_uri') ??
    u.searchParams.get('redirect_to') ??
    '';
  let redirectHost = '';
  try {
    redirectHost = redirectUri ? new URL(redirectUri).hostname : '';
  } catch {
    redirectHost = '';
  }

  return {
    provider,
    requestingApp: redirectHost ? appNameFromHost(redirectHost) : 'Unknown application',
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
    .replace(/^https:\/\/graph\.microsoft\.com\//, '')
    .replace(/^openid$/, 'openid');
}
