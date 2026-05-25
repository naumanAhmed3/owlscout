import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Download,
  Eye,
  KeyRound,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { AppCategory, DiscoveredApp, InventorySummary, RiskTier } from '@/lib/types';
import { clearAll, getAllApps, replaceAll } from '@/lib/db';
import { summarize } from '@/lib/inventory';
import { buildDemoData } from '@/lib/demo-data';
import { buildInsights, appMatchesInsight, type InsightId } from '@/lib/insights';
import { CATEGORY_LABEL, RISK_META, relativeTime } from '@/lib/ui';
import { LanternMark } from '@/components/lantern-mark';
import {
  ActivityLog,
  AppDrawer,
  AppTile,
  AuthChips,
  EmptyState,
  InsightsPanel,
  RiskBar,
  RiskPill,
  StatCard,
} from './components';

type SortKey = 'risk' | 'name' | 'lastSeen';

const INSIGHT_TITLE: Record<InsightId, string> = {
  'high-risk': 'High-risk apps',
  'oauth-broad': 'Broad OAuth grants',
  'sso-gap': 'SSO gaps',
  unmanaged: 'Unmanaged apps',
};

export default function App() {
  const [apps, setApps] = useState<DiscoveredApp[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DiscoveredApp | null>(null);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AppCategory | 'all'>('all');
  const [risk, setRisk] = useState<RiskTier | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('risk');
  const [focus, setFocus] = useState<InsightId | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, sum] = await Promise.all([getAllApps(), summarize()]);
    setApps(list);
    setSummary(sum);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const seed = async () => {
    const { apps: a, events } = buildDemoData();
    await replaceAll(a, events);
    await load();
  };

  const wipe = async () => {
    if (!confirm('Clear the entire discovered-app inventory?')) return;
    await clearAll();
    setSelected(null);
    await load();
  };

  const insights = useMemo(() => buildInsights(apps), [apps]);

  const filtered = useMemo(() => {
    let list = apps.filter((a) => {
      if (focus && !appMatchesInsight(a, focus)) return false;
      if (category !== 'all' && a.category !== category) return false;
      if (risk !== 'all' && a.riskTier !== risk) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.domain.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'lastSeen') return b.lastSeen - a.lastSeen;
      return b.riskScore - a.riskScore;
    });
    return list;
  }, [apps, focus, category, risk, query, sort]);

  const exportData = (format: 'csv' | 'json') => {
    setExportOpen(false);
    let blob: Blob;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(apps, null, 2)], { type: 'application/json' });
    } else {
      const head = [
        'name',
        'domain',
        'category',
        'riskScore',
        'riskTier',
        'inCatalog',
        'authMethods',
        'oauthGrants',
        'firstSeen',
        'lastSeen',
      ];
      const rows = apps.map((a) =>
        [
          a.name,
          a.domain,
          a.category,
          a.riskScore,
          a.riskTier,
          a.inCatalog,
          a.authMethods.join('|'),
          a.oauthGrants.length,
          new Date(a.firstSeen).toISOString(),
          new Date(a.lastSeen).toISOString(),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      blob = new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lantern-inventory.${format}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const empty = !loading && apps.length === 0;

  return (
    <div className="min-h-screen bg-ink text-[#e7e9ec]">
      {/* Header */}
      <header className="border-b border-edge-soft sticky top-0 z-30 bg-ink/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-9 h-9 rounded-xl bg-accent/15 ring-1 ring-accent/30">
              <LanternMark className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-semibold leading-none">Lantern</div>
              <div className="hidden sm:block text-[11px] text-neutral-500 mt-0.5">
                Shadow-IT discovery · scanned locally, nothing leaves your browser
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <IconButton onClick={load} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </IconButton>
            </div>
            <div className="hidden sm:block relative">
              <button
                onClick={() => setExportOpen((v) => !v)}
                disabled={apps.length === 0}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-surface ring-1 ring-edge text-sm hover:bg-surface-2 disabled:opacity-40 transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-surface ring-1 ring-edge rounded-lg overflow-hidden shadow-xl">
                  <button
                    onClick={() => exportData('csv')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={seed}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-accent text-ink text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Sample data
            </button>
            {apps.length > 0 && (
              <div className="hidden sm:block">
                <IconButton onClick={wipe} title="Clear inventory">
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {loading && <div className="py-24 text-center text-neutral-500">Loading inventory…</div>}

        {empty && <EmptyState onSeed={seed} />}

        {!loading && summary && apps.length > 0 && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard
                label="Apps discovered"
                value={summary.totalApps}
                hint={`${summary.newThisWeek} new this week`}
                icon={<Boxes className="w-4 h-4 text-neutral-500" />}
              />
              <StatCard
                label="High risk"
                value={summary.highRisk}
                hint="need review"
                tone="rose"
                icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
              />
              <StatCard
                label="Unmanaged"
                value={summary.unmanaged}
                hint="shadow IT"
                tone="amber"
                icon={<TriangleAlert className="w-4 h-4 text-amber-400" />}
              />
              <StatCard
                label="OAuth grants"
                value={summary.oauthGrants}
                hint="on corporate identity"
                icon={<KeyRound className="w-4 h-4 text-accent" />}
              />
              <StatCard
                label="SSO-taxed"
                value={summary.ssoTaxApps}
                hint="vendors gating SSO"
                icon={<Eye className="w-4 h-4 text-neutral-500" />}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <RiskBar summary={summary} />
              <ActivityLog />
            </div>

            {/* Needs attention — actionable insights */}
            <div className="mt-6">
              <InsightsPanel insights={insights} focus={focus} onSelect={setFocus} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mt-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search apps…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface ring-1 ring-edge text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-accent/40"
                />
              </div>
              <Select
                value={category}
                onChange={(v) => setCategory(v as AppCategory | 'all')}
                options={[
                  ['all', 'All categories'],
                  ...Object.entries(CATEGORY_LABEL),
                ]}
              />
              <Select
                value={risk}
                onChange={(v) => setRisk(v as RiskTier | 'all')}
                options={[
                  ['all', 'All risk'],
                  ['high', 'High risk'],
                  ['medium', 'Medium risk'],
                  ['low', 'Low risk'],
                ]}
              />
              <Select
                value={sort}
                onChange={(v) => setSort(v as SortKey)}
                options={[
                  ['risk', 'Sort: Risk'],
                  ['name', 'Sort: Name'],
                  ['lastSeen', 'Sort: Recent'],
                ]}
              />
            </div>

            {/* Active insight filter chip */}
            {focus && (
              <button
                onClick={() => setFocus(null)}
                className="mt-3 inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-accent/15 ring-1 ring-accent/40 text-xs text-accent"
              >
                Filtered: {INSIGHT_TITLE[focus]}
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Table */}
            <div className="mt-3 bg-surface rounded-xl ring-1 ring-edge overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-edge-soft">
                    <th className="text-left font-medium px-4 py-2.5">Application</th>
                    <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">
                      Sign-in
                    </th>
                    <th className="text-left font-medium px-4 py-2.5">OAuth</th>
                    <th className="text-left font-medium px-4 py-2.5">Risk</th>
                    <th className="text-left font-medium px-4 py-2.5 hidden sm:table-cell">
                      Last seen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => setSelected(app)}
                      className="border-b border-edge-soft last:border-0 hover:bg-surface-2 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <AppTile app={app} />
                          <div>
                            <div className="font-medium leading-tight flex items-center gap-1.5">
                              {app.name}
                              {!app.inCatalog && (
                                <span className="text-[9px] uppercase tracking-wide text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                                  Unmanaged
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500">{app.domain}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-neutral-400 hidden md:table-cell">
                        {CATEGORY_LABEL[app.category]}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell">
                        <AuthChips methods={app.authMethods} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-neutral-400">
                        {app.oauthGrants.length || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <RiskPill app={app} />
                      </td>
                      <td className="px-4 py-2.5 text-neutral-500 hidden sm:table-cell">
                        {relativeTime(app.lastSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-neutral-600">
                  No apps match these filters.
                </div>
              )}
            </div>
            <div className="text-[11px] text-neutral-600 mt-2">
              Showing {filtered.length} of {apps.length} apps
            </div>
          </>
        )}
      </main>

      {selected && <AppDrawer app={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid place-items-center w-9 h-9 rounded-lg bg-surface ring-1 ring-edge text-neutral-400 hover:text-neutral-100 hover:bg-surface-2 transition-colors"
    >
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 px-3 rounded-lg bg-surface ring-1 ring-edge text-sm text-neutral-300 focus:outline-none focus:ring-accent/40"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v} className="bg-surface">
          {label}
        </option>
      ))}
    </select>
  );
}
