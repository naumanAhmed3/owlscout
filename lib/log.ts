// ─────────────────────────────────────────────────────────────
// A small ring-buffer activity log in chrome.storage.local. The
// service worker appends to it; the dashboard renders it live via
// storage.onChanged. Lets you watch OwlScout work without ever
// opening DevTools. No-ops gracefully outside an extension context
// (e.g. the hosted dashboard demo).
// ─────────────────────────────────────────────────────────────

export type SignalKind = 'system' | 'idp-nav' | 'oauth' | 'auth' | 'visit';

export interface SignalLogEntry {
  at: number;
  kind: SignalKind;
  message: string;
}

const KEY = 'owlscout:signal-log';
const MAX = 80;

// chrome.* is a plain global — referencing it needs no import and is
// simply undefined in a normal web page.
const storage = (globalThis as { chrome?: { storage?: { local?: any }; runtime?: any } })
  .chrome?.storage?.local as
  | {
      get(key: string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(key: string): Promise<void>;
    }
  | undefined;

export function hasSignalLog(): boolean {
  return !!storage;
}

export async function appendLog(kind: SignalKind, message: string): Promise<void> {
  if (!storage) return;
  try {
    const stored = await storage.get(KEY);
    const log = (stored[KEY] as SignalLogEntry[] | undefined) ?? [];
    log.push({ at: Date.now(), kind, message });
    if (log.length > MAX) log.splice(0, log.length - MAX);
    await storage.set({ [KEY]: log });
  } catch {
    /* storage unavailable — ignore */
  }
}

export async function getLog(): Promise<SignalLogEntry[]> {
  if (!storage) return [];
  try {
    const stored = await storage.get(KEY);
    return ((stored[KEY] as SignalLogEntry[] | undefined) ?? []).slice().reverse();
  } catch {
    return [];
  }
}

export async function clearLog(): Promise<void> {
  if (!storage) return;
  try {
    await storage.remove(KEY);
  } catch {
    /* ignore */
  }
}

/** Subscribe to live log changes. Returns an unsubscribe fn. */
export function onLogChange(cb: () => void): () => void {
  const runtime = (globalThis as { chrome?: { storage?: any } }).chrome?.storage;
  if (!runtime?.onChanged) return () => {};
  const handler = (changes: Record<string, unknown>) => {
    if (KEY in changes) cb();
  };
  runtime.onChanged.addListener(handler);
  return () => runtime.onChanged.removeListener(handler);
}
