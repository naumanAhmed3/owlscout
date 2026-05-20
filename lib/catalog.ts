import type { CatalogEntry } from './types';

// ─────────────────────────────────────────────────────────────
// Bundled SaaS catalog. Keyed by registrable domain at lookup time.
// `ssoTax` marks vendors that gate SSO behind a higher tier — the
// "SSO tax" that pushes teams toward unmanaged self-signup.
// ─────────────────────────────────────────────────────────────

export const CATALOG: CatalogEntry[] = [
  // ── Engineering ──────────────────────────────────────────
  { id: 'github', name: 'GitHub', domains: ['github.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'gitlab', name: 'GitLab', domains: ['gitlab.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'bitbucket', name: 'Bitbucket', domains: ['bitbucket.org'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'vercel', name: 'Vercel', domains: ['vercel.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'netlify', name: 'Netlify', domains: ['netlify.com', 'app.netlify.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'sentry', name: 'Sentry', domains: ['sentry.io'], category: 'engineering', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'datadog', name: 'Datadog', domains: ['datadoghq.com', 'app.datadoghq.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'circleci', name: 'CircleCI', domains: ['circleci.com', 'app.circleci.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'linear', name: 'Linear', domains: ['linear.app'], category: 'engineering', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'jira', name: 'Jira', domains: ['atlassian.net'], category: 'engineering', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'pagerduty', name: 'PagerDuty', domains: ['pagerduty.com'], category: 'engineering', sensitivity: 'medium', ssoSupported: true, ssoTax: false },
  { id: 'postman', name: 'Postman', domains: ['postman.com', 'go.postman.co'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'render', name: 'Render', domains: ['render.com', 'dashboard.render.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'supabase', name: 'Supabase', domains: ['supabase.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'cloudflare', name: 'Cloudflare', domains: ['cloudflare.com', 'dash.cloudflare.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'aws', name: 'AWS Console', domains: ['aws.amazon.com', 'console.aws.amazon.com', 'signin.aws.amazon.com'], category: 'engineering', sensitivity: 'high', ssoSupported: true, ssoTax: false },

  // ── Design ───────────────────────────────────────────────
  { id: 'figma', name: 'Figma', domains: ['figma.com'], category: 'design', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'canva', name: 'Canva', domains: ['canva.com'], category: 'design', sensitivity: 'low', ssoSupported: true, ssoTax: true },
  { id: 'framer', name: 'Framer', domains: ['framer.com'], category: 'design', sensitivity: 'low', ssoSupported: true, ssoTax: true },
  { id: 'miro', name: 'Miro', domains: ['miro.com'], category: 'design', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'zeplin', name: 'Zeplin', domains: ['zeplin.io'], category: 'design', sensitivity: 'low', ssoSupported: true, ssoTax: true },

  // ── Productivity ─────────────────────────────────────────
  { id: 'notion', name: 'Notion', domains: ['notion.so', 'notion.com'], category: 'productivity', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'asana', name: 'Asana', domains: ['asana.com', 'app.asana.com'], category: 'productivity', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'trello', name: 'Trello', domains: ['trello.com'], category: 'productivity', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'monday', name: 'monday.com', domains: ['monday.com'], category: 'productivity', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'clickup', name: 'ClickUp', domains: ['clickup.com', 'app.clickup.com'], category: 'productivity', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'airtable', name: 'Airtable', domains: ['airtable.com'], category: 'productivity', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'coda', name: 'Coda', domains: ['coda.io'], category: 'productivity', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'google-workspace', name: 'Google Workspace', domains: ['workspace.google.com', 'admin.google.com'], category: 'productivity', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'microsoft-365', name: 'Microsoft 365', domains: ['office.com', 'microsoft365.com', 'portal.office.com'], category: 'productivity', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'calendly', name: 'Calendly', domains: ['calendly.com'], category: 'productivity', sensitivity: 'low', ssoSupported: true, ssoTax: true },

  // ── Communication ────────────────────────────────────────
  { id: 'slack', name: 'Slack', domains: ['slack.com'], category: 'communication', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'zoom', name: 'Zoom', domains: ['zoom.us'], category: 'communication', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'loom', name: 'Loom', domains: ['loom.com'], category: 'communication', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'discord', name: 'Discord', domains: ['discord.com'], category: 'communication', sensitivity: 'low', ssoSupported: false, ssoTax: false },
  { id: 'intercom', name: 'Intercom', domains: ['intercom.com'], category: 'communication', sensitivity: 'medium', ssoSupported: true, ssoTax: false },

  // ── CRM & Sales ──────────────────────────────────────────
  { id: 'salesforce', name: 'Salesforce', domains: ['salesforce.com', 'lightning.force.com'], category: 'crm-sales', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'hubspot', name: 'HubSpot', domains: ['hubspot.com', 'app.hubspot.com'], category: 'crm-sales', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'pipedrive', name: 'Pipedrive', domains: ['pipedrive.com'], category: 'crm-sales', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'apollo', name: 'Apollo.io', domains: ['apollo.io', 'app.apollo.io'], category: 'crm-sales', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'outreach', name: 'Outreach', domains: ['outreach.io'], category: 'crm-sales', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'gong', name: 'Gong', domains: ['gong.io', 'app.gong.io'], category: 'crm-sales', sensitivity: 'high', ssoSupported: true, ssoTax: false },

  // ── HR & People ──────────────────────────────────────────
  { id: 'bamboohr', name: 'BambooHR', domains: ['bamboohr.com'], category: 'hr-people', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'gusto', name: 'Gusto', domains: ['gusto.com'], category: 'hr-people', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'workday', name: 'Workday', domains: ['workday.com', 'myworkday.com'], category: 'hr-people', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'rippling', name: 'Rippling', domains: ['rippling.com', 'app.rippling.com'], category: 'hr-people', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'deel', name: 'Deel', domains: ['deel.com', 'app.deel.com'], category: 'hr-people', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'lattice', name: 'Lattice', domains: ['lattice.com'], category: 'hr-people', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'greenhouse', name: 'Greenhouse', domains: ['greenhouse.io'], category: 'hr-people', sensitivity: 'high', ssoSupported: true, ssoTax: false },

  // ── Finance ──────────────────────────────────────────────
  { id: 'stripe', name: 'Stripe', domains: ['stripe.com', 'dashboard.stripe.com'], category: 'finance', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'brex', name: 'Brex', domains: ['brex.com'], category: 'finance', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'ramp', name: 'Ramp', domains: ['ramp.com', 'app.ramp.com'], category: 'finance', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'quickbooks', name: 'QuickBooks', domains: ['quickbooks.intuit.com', 'qbo.intuit.com'], category: 'finance', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'mercury', name: 'Mercury', domains: ['mercury.com'], category: 'finance', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'bill', name: 'Bill.com', domains: ['bill.com'], category: 'finance', sensitivity: 'high', ssoSupported: true, ssoTax: false },

  // ── Security & Identity ──────────────────────────────────
  { id: 'okta', name: 'Okta', domains: ['okta.com'], category: 'security-identity', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'onepassword', name: '1Password', domains: ['1password.com'], category: 'security-identity', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'auth0', name: 'Auth0', domains: ['auth0.com', 'manage.auth0.com'], category: 'security-identity', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'vanta', name: 'Vanta', domains: ['vanta.com', 'app.vanta.com'], category: 'security-identity', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'snyk', name: 'Snyk', domains: ['snyk.io', 'app.snyk.io'], category: 'security-identity', sensitivity: 'high', ssoSupported: true, ssoTax: true },

  // ── Data & Analytics ─────────────────────────────────────
  { id: 'snowflake', name: 'Snowflake', domains: ['snowflake.com', 'snowflakecomputing.com'], category: 'data-analytics', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'looker', name: 'Looker', domains: ['looker.com'], category: 'data-analytics', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'amplitude', name: 'Amplitude', domains: ['amplitude.com', 'app.amplitude.com'], category: 'data-analytics', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'mixpanel', name: 'Mixpanel', domains: ['mixpanel.com'], category: 'data-analytics', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'metabase', name: 'Metabase', domains: ['metabase.com'], category: 'data-analytics', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'posthog', name: 'PostHog', domains: ['posthog.com'], category: 'data-analytics', sensitivity: 'medium', ssoSupported: true, ssoTax: true },

  // ── AI / ML ──────────────────────────────────────────────
  { id: 'openai', name: 'OpenAI Platform', domains: ['platform.openai.com', 'chatgpt.com'], category: 'ai-ml', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'anthropic', name: 'Anthropic Console', domains: ['console.anthropic.com', 'claude.ai'], category: 'ai-ml', sensitivity: 'high', ssoSupported: true, ssoTax: false },
  { id: 'huggingface', name: 'Hugging Face', domains: ['huggingface.co'], category: 'ai-ml', sensitivity: 'medium', ssoSupported: true, ssoTax: false },
  { id: 'cursor', name: 'Cursor', domains: ['cursor.com', 'cursor.sh'], category: 'ai-ml', sensitivity: 'high', ssoSupported: true, ssoTax: false },

  // ── Marketing ────────────────────────────────────────────
  { id: 'mailchimp', name: 'Mailchimp', domains: ['mailchimp.com'], category: 'marketing', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
  { id: 'webflow', name: 'Webflow', domains: ['webflow.com'], category: 'marketing', sensitivity: 'low', ssoSupported: true, ssoTax: true },
  { id: 'semrush', name: 'Semrush', domains: ['semrush.com'], category: 'marketing', sensitivity: 'low', ssoSupported: true, ssoTax: true },

  // ── Storage ──────────────────────────────────────────────
  { id: 'dropbox', name: 'Dropbox', domains: ['dropbox.com'], category: 'storage', sensitivity: 'high', ssoSupported: true, ssoTax: true },
  { id: 'box', name: 'Box', domains: ['box.com', 'app.box.com'], category: 'storage', sensitivity: 'high', ssoSupported: true, ssoTax: false },

  // ── Support ──────────────────────────────────────────────
  { id: 'zendesk', name: 'Zendesk', domains: ['zendesk.com'], category: 'support', sensitivity: 'medium', ssoSupported: true, ssoTax: false },
  { id: 'freshdesk', name: 'Freshdesk', domains: ['freshdesk.com'], category: 'support', sensitivity: 'medium', ssoSupported: true, ssoTax: true },
];

const DOMAIN_INDEX = new Map<string, CatalogEntry>();
for (const entry of CATALOG) {
  for (const domain of entry.domains) DOMAIN_INDEX.set(domain, entry);
}

/** Strip a hostname down to its registrable domain (e.g. app.figma.com -> figma.com). */
export function registrableDomain(hostname: string): string {
  const parts = hostname.toLowerCase().replace(/^www\./, '').split('.');
  if (parts.length <= 2) return parts.join('.');
  // Handle common two-part public suffixes (co.uk, com.au, etc.)
  const twoPartTld = /^(co|com|net|org|gov|ac)\.[a-z]{2}$/.test(parts.slice(-2).join('.'));
  return parts.slice(twoPartTld ? -3 : -2).join('.');
}

/** Resolve a hostname to a catalog entry, matching subdomains too. */
export function lookupCatalog(hostname: string): CatalogEntry | undefined {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (DOMAIN_INDEX.has(host)) return DOMAIN_INDEX.get(host);
  const reg = registrableDomain(host);
  if (DOMAIN_INDEX.has(reg)) return DOMAIN_INDEX.get(reg);
  // Subdomain match against catalog domains.
  for (const entry of CATALOG) {
    if (entry.domains.some((d) => host === d || host.endsWith('.' + d))) return entry;
  }
  return undefined;
}

export const CATALOG_SIZE = CATALOG.length;
