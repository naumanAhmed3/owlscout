import type { AuthMethod, PageAuthSignal, RuntimeMessage } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Content script — reads the auth surface of a page (password
// fields, social / SSO sign-in buttons) and reports it once.
// This is how OwlScout discovers SaaS apps that aren't in the
// bundled catalog: any page with a real login surface counts.
// ─────────────────────────────────────────────────────────────

interface SsoPattern {
  re: RegExp;
  method: AuthMethod;
}

const SSO_PATTERNS: SsoPattern[] = [
  { re: /\b(sign in|log in|continue|connect)\s+with\s+google\b/i, method: 'google-oauth' },
  { re: /\b(sign in|log in|continue|connect)\s+with\s+(microsoft|azure|office\s?365)\b/i, method: 'microsoft-oauth' },
  { re: /\b(sign in|log in|continue|connect)\s+with\s+github\b/i, method: 'github-oauth' },
  { re: /\b(sign in|log in|continue|connect)\s+with\s+apple\b/i, method: 'apple-oauth' },
  { re: /\b(sign in|log in|continue)\s+with\s+(sso|saml|okta|single sign-?on)\b/i, method: 'sso-saml' },
  { re: /\bsingle sign-?on\b|\buse sso\b|\bsaml\b/i, method: 'sso-saml' },
];

function detectAuthSurface(): PageAuthSignal | null {
  const hasPasswordField = !!document.querySelector('input[type="password"]');

  // Collect candidate clickable elements and scan their visible text.
  const clickables = document.querySelectorAll<HTMLElement>(
    'button, a, [role="button"], input[type="submit"], input[type="button"]',
  );
  const found = new Set<AuthMethod>();
  for (const el of clickables) {
    const text = (el.innerText || el.getAttribute('aria-label') || (el as HTMLInputElement).value || '')
      .trim()
      .slice(0, 120);
    if (!text) continue;
    for (const { re, method } of SSO_PATTERNS) {
      if (re.test(text)) found.add(method);
    }
  }

  if (!hasPasswordField && found.size === 0) return null;

  return {
    hostname: location.hostname,
    url: location.href,
    hasPasswordField,
    authMethods: [...found],
  };
}

function report(signal: PageAuthSignal): void {
  const message: RuntimeMessage = { kind: 'page-auth-signal', payload: signal };
  browser.runtime.sendMessage(message).catch(() => {
    /* service worker asleep or context gone — safe to ignore */
  });
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    // Skip non-page contexts.
    if (location.protocol !== 'https:' && location.protocol !== 'http:') return;

    let reported = false;
    const scan = () => {
      if (reported) return;
      const signal = detectAuthSurface();
      if (signal) {
        reported = true;
        report(signal);
      }
    };

    scan();
    // SPA login pages often render auth controls after first paint.
    if (!reported) {
      setTimeout(scan, 1500);
      setTimeout(scan, 4000);
    }
  },
});
