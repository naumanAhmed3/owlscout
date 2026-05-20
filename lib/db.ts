import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppEvent, DiscoveredApp } from './types';

// ─────────────────────────────────────────────────────────────
// IndexedDB persistence. Shared across the service worker (writes)
// and the popup / options pages (reads) — same extension origin.
// ─────────────────────────────────────────────────────────────

interface OwlScoutDB extends DBSchema {
  apps: {
    key: string;
    value: DiscoveredApp;
    indexes: { 'by-lastSeen': number; 'by-risk': number };
  };
  events: {
    key: string;
    value: AppEvent;
    indexes: { 'by-app': string; 'by-at': number };
  };
}

let dbPromise: Promise<IDBPDatabase<OwlScoutDB>> | null = null;

function getDb(): Promise<IDBPDatabase<OwlScoutDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OwlScoutDB>('owlscout', 1, {
      upgrade(db) {
        const apps = db.createObjectStore('apps', { keyPath: 'id' });
        apps.createIndex('by-lastSeen', 'lastSeen');
        apps.createIndex('by-risk', 'riskScore');
        const events = db.createObjectStore('events', { keyPath: 'id' });
        events.createIndex('by-app', 'appId');
        events.createIndex('by-at', 'at');
      },
    });
  }
  return dbPromise;
}

export async function getApp(id: string): Promise<DiscoveredApp | undefined> {
  return (await getDb()).get('apps', id);
}

export async function getAllApps(): Promise<DiscoveredApp[]> {
  return (await getDb()).getAll('apps');
}

export async function putApp(app: DiscoveredApp): Promise<void> {
  await (await getDb()).put('apps', app);
}

export async function addEvent(event: AppEvent): Promise<void> {
  await (await getDb()).put('events', event);
}

export async function getEventsForApp(appId: string): Promise<AppEvent[]> {
  const events = await (await getDb()).getAllFromIndex('events', 'by-app', appId);
  return events.sort((a, b) => b.at - a.at);
}

export async function getRecentEvents(limit = 20): Promise<AppEvent[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex('events', 'by-at');
  return all.reverse().slice(0, limit);
}

export async function countEvents(): Promise<number> {
  return (await getDb()).count('events');
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['apps', 'events'], 'readwrite');
  await Promise.all([tx.objectStore('apps').clear(), tx.objectStore('events').clear(), tx.done]);
}

/** Bulk replace the whole inventory — used by the demo seeder. */
export async function replaceAll(apps: DiscoveredApp[], events: AppEvent[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['apps', 'events'], 'readwrite');
  await tx.objectStore('apps').clear();
  await tx.objectStore('events').clear();
  for (const app of apps) await tx.objectStore('apps').put(app);
  for (const event of events) await tx.objectStore('events').put(event);
  await tx.done;
}
