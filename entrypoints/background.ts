import type { RuntimeMessage } from '@/lib/types';
import { lookupCatalog } from '@/lib/catalog';
import { identityProviderFor, parseOAuthGrant } from '@/lib/oauth';
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
  // Per-tab memory of the last real app host. Lets us attribute an
  // OAuth grant to the app that started it even when the authorize
  // URL omits redirect_uri (GitHub treats it as optional).
  const tabAppHost = new Map<number, string>();

  // ── OAuth consent detection ────────────────────────────────
  browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return;

    let hostname = '';
    try {
      hostname = new URL(details.url).hostname;
    } catch {
      return;
    }
    if (!identityProviderFor(hostname)) return;

    const grant = parseOAuthGrant(details.url);
    if (!grant) {
      console.info('[OwlScout] identity-provider navigation (no client_id):', hostname);
      return;
    }

    // Attribute the grant: prefer the redirect host, then the tab the
    // flow started in, then — for popup flows — the opener tab.
    let tabHost = details.tabId >= 0 ? tabAppHost.get(details.tabId) : undefined;
    if (!tabHost && details.tabId >= 0) {
      try {
        const tab = await browser.tabs.get(details.tabId);
        if (tab.openerTabId != null) tabHost = tabAppHost.get(tab.openerTabId);
      } catch {
        /* tab gone — ignore */
      }
    }

    const candidates = [grant.redirectHost, tabHost].filter(
      (h): h is string => !!h,
    );
    const host = candidates.find((h) => lookupCatalog(h)) ?? candidates[0];

    if (host) {
      console.info(
        `[OwlScout] OAuth grant — ${grant.provider} → ${host} · ${grant.scopes.length} scope(s)`,
      );
      void recordOAuthGrant(grant, host);
    } else {
      console.info(
        `[OwlScout] OAuth flow seen (${grant.provider}) but could not attribute an app`,
      );
    }
  });

  // ── Visit detection + per-tab app-host tracking ────────────
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url) return;
    let host: string;
    try {
      const u = new URL(tab.url);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
      host = u.hostname;
    } catch {
      return;
    }
    // Remember the tab's app host — but never an identity provider.
    if (!identityProviderFor(host)) {
      tabAppHost.set(tabId, host);
    }
    // Auto-record catalogued apps; unrecognised apps are discovered
    // through the content script's auth-surface signal.
    if (lookupCatalog(host)) {
      void recordVisit(host);
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    tabAppHost.delete(tabId);
  });

  // ── Content-script auth-surface signals ────────────────────
  browser.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.kind === 'page-auth-signal') {
      return recordAuthSignal(message.payload).then(() => ({ ok: true }));
    }
    return undefined;
  });

  console.info('[OwlScout] service worker ready — watching for SaaS + OAuth activity');
});
