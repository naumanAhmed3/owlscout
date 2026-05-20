import { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  Fingerprint,
  KeyRound,
  Radio,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { AppEvent, DiscoveredApp, InventorySummary } from '@/lib/types';
import { getEventsForApp } from '@/lib/db';
import { prettyScope } from '@/lib/oauth';
import {
  clearLog,
  getLog,
  hasSignalLog,
  onLogChange,
  type SignalKind,
  type SignalLogEntry,
} from '@/lib/log';
import {
  AUTH_LABEL,
  CATEGORY_LABEL,
  RISK_META,
  appColor,
  formatDate,
  relativeTime,
} from '@/lib/ui';

// ── Stat card ────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'default' | 'rose' | 'amber' | 'emerald';
}) {
  const toneRing =
    tone === 'rose'
      ? 'ring-rose-500/20'
      : tone === 'amber'
        ? 'ring-amber-500/20'
        : tone === 'emerald'
          ? 'ring-emerald-500/20'
          : 'ring-edge';
  return (
    <div className={`bg-surface rounded-xl ring-1 ${toneRing} p-4 owl-fade-up`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-semibold font-mono tracking-tight mt-2">{value}</div>
      {hint && <div className="text-[11px] text-neutral-500 mt-0.5">{hint}</div>}
    </div>
  );
}

// ── Risk distribution bar ────────────────────────────────────
export function RiskBar({ summary }: { summary: InventorySummary }) {
  const total = Math.max(summary.totalApps, 1);
  const rows: Array<['high' | 'medium' | 'low', number]> = [
    ['high', summary.highRisk],
    ['medium', summary.mediumRisk],
    ['low', summary.lowRisk],
  ];
  return (
    <div className="bg-surface rounded-xl ring-1 ring-edge p-4">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2.5">
        Risk distribution
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-ink">
        {rows.map(([tier, count]) => (
          <div
            key={tier}
            className={RISK_META[tier].dot}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${count} ${tier}`}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-2.5">
        {rows.map(([tier, count]) => (
          <div key={tier} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${RISK_META[tier].dot}`} />
            <span className="text-xs text-neutral-400">
              {RISK_META[tier].label}{' '}
              <span className="font-mono text-neutral-300">{count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Risk pill ────────────────────────────────────────────────
export function RiskPill({ app }: { app: DiscoveredApp }) {
  const m = RISK_META[app.riskTier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${m.bg} ${m.text} ring-1 ${m.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      <span className="font-mono">{app.riskScore}</span>
      {m.label}
    </span>
  );
}

// ── Auth method chips ────────────────────────────────────────
export function AuthChips({ methods }: { methods: DiscoveredApp['authMethods'] }) {
  if (methods.length === 0)
    return <span className="text-xs text-neutral-600">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((m) => (
        <span
          key={m}
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            m === 'sso-saml'
              ? 'bg-emerald-500/10 text-emerald-300'
              : m === 'password'
                ? 'bg-neutral-700/40 text-neutral-300'
                : 'bg-sky-500/10 text-sky-300'
          }`}
        >
          {AUTH_LABEL[m]}
        </span>
      ))}
    </div>
  );
}

// ── App avatar tile ──────────────────────────────────────────
export function AppTile({ app, size = 32 }: { app: DiscoveredApp; size?: number }) {
  return (
    <div
      className="rounded-lg grid place-items-center font-semibold text-ink shrink-0"
      style={{
        width: size,
        height: size,
        background: appColor(app.id),
        fontSize: size * 0.36,
      }}
    >
      {app.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Score ring ───────────────────────────────────────────────
function ScoreRing({ app }: { app: DiscoveredApp }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const m = RISK_META[app.riskTier];
  const stroke =
    app.riskTier === 'high' ? '#fb7185' : app.riskTier === 'medium' ? '#fbbf24' : '#34d399';
  return (
    <div className="relative w-[88px] h-[88px]">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#21262e" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (app.riskScore / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold font-mono leading-none">{app.riskScore}</div>
          <div className={`text-[10px] uppercase tracking-wide ${m.text}`}>{m.label}</div>
        </div>
      </div>
    </div>
  );
}

// ── App detail drawer ────────────────────────────────────────
export function AppDrawer({
  app,
  onClose,
}: {
  app: DiscoveredApp;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<AppEvent[]>([]);
  useEffect(() => {
    void getEventsForApp(app.id).then(setEvents);
  }, [app.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-ink ring-1 ring-edge overflow-y-auto owl-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-edge-soft">
          <div className="flex items-center gap-3">
            <AppTile app={app} size={44} />
            <div>
              <div className="text-lg font-semibold leading-tight">{app.name}</div>
              <div className="text-xs text-neutral-500">{app.domain}</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                {CATEGORY_LABEL[app.category]}
                {!app.inCatalog && (
                  <span className="ml-1.5 text-amber-400">· Unmanaged</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Risk */}
        <div className="p-5 flex items-center gap-5 border-b border-edge-soft">
          <ScoreRing app={app} />
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5">
              Why this score
            </div>
            <ul className="space-y-1">
              {app.riskFactors.map((f, i) => (
                <li key={i} className="text-xs text-neutral-300 flex gap-1.5">
                  <span className="text-neutral-600">·</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sign-in */}
        <Section icon={<Fingerprint className="w-4 h-4 text-sky-400" />} title="Sign-in methods">
          <AuthChips methods={app.authMethods} />
          <div className="flex gap-4 mt-3 text-xs text-neutral-500">
            <span>
              Visits <span className="font-mono text-neutral-300">{app.visitCount}</span>
            </span>
            <span>
              SSO{' '}
              <span className="font-mono text-neutral-300">
                {app.ssoSupported ? 'supported' : 'no'}
              </span>
            </span>
            {app.ssoTax && <span className="text-amber-400">SSO-taxed vendor</span>}
          </div>
        </Section>

        {/* OAuth grants */}
        <Section
          icon={<KeyRound className="w-4 h-4 text-owl" />}
          title={`OAuth grants (${app.oauthGrants.length})`}
        >
          {app.oauthGrants.length === 0 ? (
            <p className="text-xs text-neutral-600">No OAuth grants observed.</p>
          ) : (
            <div className="space-y-3">
              {app.oauthGrants.map((g, i) => (
                <div key={i} className="bg-surface rounded-lg ring-1 ring-edge-soft p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize">{g.provider} identity</span>
                    <span className="text-[10px] text-neutral-500">
                      {relativeTime(g.detectedAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {g.scopes.map((s) => {
                      const sensitive = g.sensitiveScopes.includes(s);
                      return (
                        <span
                          key={s}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            sensitive
                              ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
                              : 'bg-ink text-neutral-400'
                          }`}
                        >
                          {prettyScope(s)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Timeline */}
        <Section icon={<Clock className="w-4 h-4 text-neutral-400" />} title="Activity">
          <div className="relative pl-4">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-edge" />
            {events.map((e) => (
              <div key={e.id} className="relative pb-3 last:pb-0">
                <span
                  className={`absolute -left-[11px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-ink ${
                    e.type === 'oauth-grant'
                      ? 'bg-owl'
                      : e.type === 'sso-detected'
                        ? 'bg-emerald-400'
                        : 'bg-neutral-600'
                  }`}
                />
                <div className="text-xs text-neutral-300">{e.detail}</div>
                <div className="text-[10px] text-neutral-600">
                  {formatDate(e.at)} · {relativeTime(e.at)}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 border-b border-edge-soft last:border-0">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[11px] uppercase tracking-wider text-neutral-400">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Live activity log ────────────────────────────────────────
const SIGNAL_META: Record<SignalKind, { color: string; label: string }> = {
  system: { color: 'bg-neutral-500', label: 'System' },
  'idp-nav': { color: 'bg-sky-400', label: 'Identity' },
  oauth: { color: 'bg-owl', label: 'OAuth' },
  auth: { color: 'bg-violet-400', label: 'Login' },
  visit: { color: 'bg-neutral-600', label: 'Visit' },
};

export function ActivityLog() {
  const [entries, setEntries] = useState<SignalLogEntry[]>([]);
  const refresh = useCallback(() => {
    void getLog().then(setEntries);
  }, []);

  useEffect(() => {
    refresh();
    return onLogChange(refresh);
  }, [refresh]);

  const inExtension = hasSignalLog();

  return (
    <div className="bg-surface rounded-xl ring-1 ring-edge p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-owl" />
          <span className="text-[11px] uppercase tracking-wider text-neutral-400">
            Live activity
          </span>
          {inExtension && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              watching
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <button
            onClick={() => void clearLog().then(refresh)}
            className="text-[11px] text-neutral-500 hover:text-neutral-300"
          >
            Clear
          </button>
        )}
      </div>

      {!inExtension ? (
        <p className="text-xs text-neutral-600 py-4 text-center">
          Live activity streams here when OwlScout runs as an installed extension.
        </p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-neutral-600 py-4 text-center">
          Nothing yet. Browse to a SaaS app or sign in with Google / GitHub —
          events appear here in real time.
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto -mx-1 px-1 space-y-0.5">
          {entries.map((e, i) => (
            <div
              key={`${e.at}-${i}`}
              className="flex items-start gap-2.5 py-1.5 text-xs"
            >
              <span
                className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${SIGNAL_META[e.kind].color}`}
              />
              <span className="text-neutral-300 flex-1 leading-snug">{e.message}</span>
              <span className="text-neutral-600 font-mono shrink-0">
                {relativeTime(e.at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────
export function EmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="grid place-items-center w-16 h-16 rounded-2xl bg-surface ring-1 ring-edge mb-4">
        <ShieldCheck className="w-7 h-7 text-owl" />
      </div>
      <h2 className="text-lg font-semibold">No apps in the inventory yet</h2>
      <p className="text-sm text-neutral-500 mt-1.5 max-w-sm leading-relaxed">
        OwlScout builds this inventory passively as you browse. To explore the dashboard
        right now, load a realistic sample inventory of a mid-size company.
      </p>
      <button
        onClick={onSeed}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-owl text-ink text-sm font-semibold hover:bg-owl/90 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Load sample inventory
      </button>
    </div>
  );
}
