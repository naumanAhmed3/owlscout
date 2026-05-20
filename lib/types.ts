// ─────────────────────────────────────────────────────────────
// Lantern — shared domain types
// ─────────────────────────────────────────────────────────────

export type AppCategory =
  | 'engineering'
  | 'design'
  | 'productivity'
  | 'communication'
  | 'crm-sales'
  | 'hr-people'
  | 'finance'
  | 'security-identity'
  | 'data-analytics'
  | 'ai-ml'
  | 'marketing'
  | 'storage'
  | 'support'
  | 'other';

export type Sensitivity = 'low' | 'medium' | 'high';

export type RiskTier = 'low' | 'medium' | 'high';

/** How the user authenticated to an app, as observed in the page. */
export type AuthMethod =
  | 'password'
  | 'google-oauth'
  | 'microsoft-oauth'
  | 'github-oauth'
  | 'apple-oauth'
  | 'sso-saml'
  | 'magic-link';

export type IdentityProvider = 'google' | 'microsoft' | 'github' | 'apple' | 'okta';

/** A static entry in the bundled SaaS catalog. */
export interface CatalogEntry {
  id: string;
  name: string;
  domains: string[];
  category: AppCategory;
  /** Inherent sensitivity of the data this app typically holds. */
  sensitivity: Sensitivity;
  /** Whether the vendor supports SSO at all. */
  ssoSupported: boolean;
  /** Whether the vendor gates SSO behind a pricier tier ("the SSO tax"). */
  ssoTax: boolean;
}

/** An OAuth consent flow observed against a corporate identity provider. */
export interface OAuthGrant {
  provider: IdentityProvider;
  /** App that requested access (derived from redirect_uri / client). */
  requestingApp: string;
  redirectHost: string;
  clientId: string;
  scopes: string[];
  /** Scopes flagged as broad / high-impact. */
  sensitiveScopes: string[];
  detectedAt: number;
}

/** A single record in the discovered-app inventory. */
export interface DiscoveredApp {
  /** Catalog id when known, else the registrable domain. */
  id: string;
  name: string;
  domain: string;
  category: AppCategory;
  inCatalog: boolean;
  sensitivity: Sensitivity;
  ssoSupported: boolean;
  ssoTax: boolean;
  firstSeen: number;
  lastSeen: number;
  visitCount: number;
  authMethods: AuthMethod[];
  oauthGrants: OAuthGrant[];
  riskScore: number;
  riskTier: RiskTier;
  riskFactors: string[];
}

export type AppEventType =
  | 'discovered'
  | 'visit'
  | 'login-page'
  | 'oauth-grant'
  | 'sso-detected';

/** An entry in an app's activity timeline. */
export interface AppEvent {
  id: string;
  appId: string;
  type: AppEventType;
  detail: string;
  at: number;
}

// ── Messaging ───────────────────────────────────────────────

/** Auth signals a content script observes on a page. */
export interface PageAuthSignal {
  hostname: string;
  url: string;
  hasPasswordField: boolean;
  authMethods: AuthMethod[];
}

export type RuntimeMessage = { kind: 'page-auth-signal'; payload: PageAuthSignal };

export interface InventorySummary {
  totalApps: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  unmanaged: number;
  oauthGrants: number;
  ssoTaxApps: number;
  newThisWeek: number;
  lastScanAt: number | null;
}
