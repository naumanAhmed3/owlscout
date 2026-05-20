import type { RuntimeMessage } from '@/lib/types';
import { lookupCatalog } from '@/lib/catalog';
import { parseOAuthGrant } from '@/lib/oauth';
import { recordAuthSignal, recordOAuthGrant, recordVisit } from '@/lib/inventory';

// ─────────────────────────────────────────────────────────────
// OwlScout service worker — the discovery brain.
//  • webNavigation  → catch OAuth consent flows
//  • tabs.onUpdated → catch visits to known SaaS apps
//  • runtime.onMessage → content-script auth-surface signals
// Everything stays local in IndexedDB; nothing leaves the browser.
// The UI (popup / options) reads that same IndexedDB directly.
// ─────────────────────────────────────────────────────────────

export default defineBackground(() => {
  // ── OAuth consent detection ────────────────────────────────
  browser.webNavigation.onBeforeNavigate.addListener((details) => {
    const grant = parseOAuthGrant(details.url);
    if (grant && grant.redirectHost) {
      void recordOAuthGrant(grant);
    }
  });

  // ── Visit detection for catalogued SaaS apps ───────────────
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url) return;
    let host: string;
    try {
      const u = new URL(tab.url);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
      host = u.hostname;
    } catch {
      return;
    }
    // Only auto-record catalogued apps here; unrecognised apps are
    // discovered through the content script's auth-surface signal.
    if (lookupCatalog(host)) {
      void recordVisit(host);
    }
  });

  // ── Content-script auth-surface signals ────────────────────
  browser.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.kind === 'page-auth-signal') {
      return recordAuthSignal(message.payload).then(() => ({ ok: true }));
    }
    return undefined;
  });
});
