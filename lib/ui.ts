import type { AppCategory, AuthMethod, RiskTier } from './types';

// ─────────────────────────────────────────────────────────────
// Presentation metadata + formatting helpers shared by the popup
// and the dashboard.
// ─────────────────────────────────────────────────────────────

export const CATEGORY_LABEL: Record<AppCategory, string> = {
  engineering: 'Engineering',
  design: 'Design',
  productivity: 'Productivity',
  communication: 'Communication',
  'crm-sales': 'CRM & Sales',
  'hr-people': 'HR & People',
  finance: 'Finance',
  'security-identity': 'Security & Identity',
  'data-analytics': 'Data & Analytics',
  'ai-ml': 'AI / ML',
  marketing: 'Marketing',
  storage: 'Storage',
  support: 'Support',
  other: 'Uncategorised',
};

export const RISK_META: Record<
  RiskTier,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  high: {
    label: 'High',
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
  medium: {
    label: 'Medium',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  low: {
    label: 'Low',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
};

export const AUTH_LABEL: Record<AuthMethod, string> = {
  password: 'Password',
  'google-oauth': 'Google',
  'microsoft-oauth': 'Microsoft',
  'github-oauth': 'GitHub',
  'apple-oauth': 'Apple',
  'sso-saml': 'SSO / SAML',
  'magic-link': 'Magic link',
};

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / (30 * day))}mo ago`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** A deterministic accent colour per app, for avatar tiles. */
export function appColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 55%)`;
}
