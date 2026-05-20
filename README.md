# Lantern — Shadow-IT Discovery

A Chrome MV3 browser extension that discovers the SaaS apps a browser
actually touches, maps **OAuth grants against corporate identity**, and
scores **shadow-IT risk** — entirely locally. Nothing ever leaves the
browser.

**[▶ Live dashboard demo](https://lantern-chi-one.vercel.app)** · loads a
realistic seeded inventory so you can explore without installing.

---

## The problem

Every company runs on SaaS, but most of it is invisible to IT. Employees
self-sign-up for tools, connect them to the corporate Google/Microsoft
account with a click, and grant standing OAuth scopes nobody reviews.
Vendors make this worse by gating SSO behind a pricier tier — the
"SSO tax" — which quietly pushes teams toward unmanaged accounts.

Lantern is the discovery layer: it watches what the browser does and
turns it into a scored, reviewable inventory.

## What it detects

| Signal | How |
|---|---|
| **Catalogued SaaS visits** | `tabs.onUpdated` matched against a 75-app catalog (domains, category, sensitivity, SSO-tax flag) |
| **OAuth consent grants** | `webNavigation.onBeforeNavigate` parses Google / Microsoft / GitHub / Apple / Okta authorize endpoints — `client_id`, `redirect_uri`, `scope` — to attribute *which app* requested *which data* |
| **Auth surface** | A content script reads each page for password fields and social/SSO sign-in buttons, which is how *uncatalogued* apps get discovered |
| **Risk** | An explainable 0–100 score from data sensitivity, OAuth scope breadth, SSO-available-but-password-used, and SSO-tax exposure — every point carries a human-readable factor |

## Architecture

```
 content script ──auth signal──▶ service worker ──▶ IndexedDB
 (every page)                     (the brain)          │
                                      ▲                │
 webNavigation ──OAuth grant─────────┘                 │
 tabs.onUpdated ──visit──────────────┘                 ▼
                                            popup  +  dashboard
                                            (read IndexedDB directly)
```

- **Service worker** (`entrypoints/background.ts`) — the discovery brain.
  Listens to `webNavigation` and `tabs`, receives content-script signals,
  and aggregates everything into a scored inventory.
- **Content script** (`entrypoints/content.ts`) — reads the auth surface
  of every page and reports it once.
- **Inventory engine** (`lib/inventory.ts`) — turns raw signals into
  `DiscoveredApp` records and re-scores on every change.
- **Popup + Dashboard** — read the same IndexedDB directly (same
  extension origin), so the UI needs no message round-trips. The
  dashboard is also browser-API-free, which is why it can be hosted
  as a standalone web app.

Everything is persisted in **IndexedDB**; no network calls, no telemetry.

## Tech

- **TypeScript** end to end, strict mode
- **WXT** + **Chrome MV3** (manifest v3, service worker, content scripts)
- **React 19** + **Tailwind CSS v4** for the popup and dashboard
- **IndexedDB** (`idb`) for local persistence
- **Vite** — WXT for the extension, a second config for the hosted demo

## Run it

```bash
pnpm install

# Develop the extension (loads into Chrome with HMR)
pnpm dev

# Production build → .output/chrome-mv3/
pnpm build

# Type-check
pnpm compile

# Build the standalone dashboard demo → dist-demo/
pnpm build:demo
```

To load the built extension: open `chrome://extensions`, enable
Developer Mode, **Load unpacked**, and select `.output/chrome-mv3`.

## Project layout

```
entrypoints/
  background.ts      service worker — discovery brain
  content.ts         auth-surface detector
  popup/             toolbar popup (summary)
  options/           the dashboard (inventory, filters, drawer, export)
lib/
  catalog.ts         75-app SaaS catalog + domain resolution
  oauth.ts           OAuth authorize-endpoint parsing + scope classification
  inventory.ts       signal aggregation
  risk.ts            explainable risk scoring
  db.ts              IndexedDB layer
  demo-data.ts       seeded sample inventory
demo/                standalone hosted build of the dashboard
```

## Privacy

Lantern is local-first by design. The catalog is bundled, detection
runs in the browser, and the inventory lives in IndexedDB. There is no
backend and no analytics — `host_permissions` exist only so the content
script can read the auth surface of pages you already visit.
