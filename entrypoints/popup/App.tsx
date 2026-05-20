import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import {
  ArrowUpRight,
  Eye,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { DiscoveredApp, InventorySummary } from '@/lib/types';
import { getAllApps, replaceAll } from '@/lib/db';
import { summarize } from '@/lib/inventory';
import { buildDemoData } from '@/lib/demo-data';
import { RISK_META, appColor, relativeTime } from '@/lib/ui';

interface State {
  summary: InventorySummary | null;
  recent: DiscoveredApp[];
  loading: boolean;
}

export default function App() {
  const [state, setState] = useState<State>({ summary: null, recent: [], loading: true });

  const load = useCallback(async () => {
    const [summary, apps] = await Promise.all([summarize(), getAllApps()]);
    const recent = apps.sort((a, b) => b.firstSeen - a.firstSeen).slice(0, 4);
    setState({ summary, recent, loading: false });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const seed = async () => {
    const { apps, events } = buildDemoData();
    await replaceAll(apps, events);
    await load();
  };

  const openDashboard = () => {
    void browser.runtime.openOptionsPage();
  };

  const s = state.summary;
  const empty = !state.loading && (!s || s.totalApps === 0);

  return (
    <div className="w-[380px] bg-ink text-[#e7e9ec] owl-fade-up">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-edge-soft">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center w-7 h-7 rounded-lg bg-owl/15 ring-1 ring-owl/30">
            <Eye className="w-4 h-4 text-owl" />
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-none">OwlScout</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Shadow-IT discovery</div>
          </div>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          Local only
        </span>
      </header>

      {state.loading && (
        <div className="p-8 text-center text-sm text-neutral-500">Loading…</div>
      )}

      {empty && (
        <div className="p-6 text-center">
          <div className="mx-auto grid place-items-center w-12 h-12 rounded-xl bg-surface ring-1 ring-edge mb-3">
            <Sparkles className="w-5 h-5 text-owl" />
          </div>
          <p className="text-sm text-neutral-300 font-medium">No apps discovered yet</p>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            OwlScout catalogs SaaS apps as you browse — logins, SSO buttons and OAuth
            grants. Keep browsing, or load a sample inventory to explore the dashboard.
          </p>
          <button
            onClick={seed}
            className="mt-4 w-full py-2 rounded-lg bg-owl text-ink text-[13px] font-semibold hover:bg-owl/90 transition-colors"
          >
            Load sample data
          </button>
        </div>
      )}

      {!state.loading && s && s.totalApps > 0 && (
        <>
          {/* Hero stat */}
          <div className="px-4 pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight font-mono">
                {s.totalApps}
              </span>
              <span className="text-sm text-neutral-400">SaaS apps discovered</span>
            </div>
            {s.newThisWeek > 0 && (
              <div className="text-[11px] text-owl mt-0.5">+{s.newThisWeek} new this week</div>
            )}
          </div>

          {/* Risk bar */}
          <div className="px-4 mt-3">
            <div className="flex h-2 rounded-full overflow-hidden bg-surface">
              {(['high', 'medium', 'low'] as const).map((tier) => {
                const count =
                  tier === 'high'
                    ? s.highRisk
                    : tier === 'medium'
                      ? s.mediumRisk
                      : s.lowRisk;
                const pct = (count / s.totalApps) * 100;
                return (
                  <div key={tier} className={RISK_META[tier].dot} style={{ width: `${pct}%` }} />
                );
              })}
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2 px-4 mt-3">
            <Stat
              icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
              value={s.highRisk}
              label="high risk"
            />
            <Stat
              icon={<TriangleAlert className="w-3.5 h-3.5 text-amber-400" />}
              value={s.unmanaged}
              label="unmanaged"
            />
          </div>

          {/* Recent discoveries */}
          <div className="px-4 mt-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">
              Latest discoveries
            </div>
            <div className="space-y-1">
              {state.recent.map((app) => (
                <div key={app.id} className="flex items-center gap-2.5 py-1.5">
                  <div
                    className="w-6 h-6 rounded-md grid place-items-center text-[10px] font-semibold text-ink shrink-0"
                    style={{ background: appColor(app.id) }}
                  >
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] truncate">{app.name}</div>
                    <div className="text-[10px] text-neutral-500">
                      {relativeTime(app.firstSeen)}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${RISK_META[app.riskTier].bg} ${RISK_META[app.riskTier].text}`}
                  >
                    {app.riskScore}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 pt-3">
            <button
              onClick={openDashboard}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface ring-1 ring-edge text-[13px] font-medium hover:bg-surface-2 transition-colors"
            >
              Open full dashboard <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface rounded-lg px-2.5 py-2 ring-1 ring-edge-soft">
      {icon}
      <span className="text-lg font-semibold font-mono leading-none">{value}</span>
      <span className="text-[11px] text-neutral-500">{label}</span>
    </div>
  );
}
