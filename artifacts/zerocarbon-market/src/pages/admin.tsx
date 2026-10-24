import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, RotateCw } from 'lucide-react';
import {
  useGetAdminDashboard, getGetAdminDashboardQueryKey, useAdminLogin, useUpdateListingVisibility,
  getGetListingsQueryKey, getGetMarketSummaryQueryKey, type Event as ZEvent,
} from '@workspace/api-client-react';
import { Page, PageTitle } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ErrorState, PageSkeleton } from '@/components/zc/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { errMsg, errStatus, fmtDate, inr, num } from '@/lib/zc';
import { formatInr } from '@/lib/pricing';

function pick(p: Record<string, unknown>, keys: string[]) {
  for (const k of keys) if (p[k] !== undefined && p[k] !== null) return p[k];
  return undefined;
}

function agentStats(events: ZEvent[]) {
  const m = new Map<string, { n: number; fails: number; total: number; max: number; lastStatus: string; confidence: string }>();
  for (const e of events) {
    const p = e.payload ?? {};
    const agent = pick(p, ['agent', 'agent_name', 'agent_id', 'service']);
    const dur = Number(pick(p, ['duration_ms', 'ms', 'elapsed_ms', 'duration']));
    if (!agent) continue;
    const status = String(pick(p, ['status', 'result', 'outcome']) ?? 'unknown');
    const st = status.toLowerCase();
    const failed = p.ok === false || p.success === false || p.outcome === 'fallback' ||
      ['fail', 'failed', 'error', 'timeout', 'invalid', 'hitl', 'budget', 'unconfigured'].some((x) => st.includes(x));
    const cur = m.get(String(agent)) ?? {
      n: 0, fails: 0, total: 0, max: 0, lastStatus: status,
      confidence: p.confidence == null ? '—' : String(p.confidence),
    };
    cur.n++;
    if (Number.isFinite(dur)) { cur.total += dur; cur.max = Math.max(cur.max, dur); }
    if (failed) cur.fails++;
    m.set(String(agent), cur);
  }
  return [...m.entries()].sort((a, b) => b[1].max - a[1].max);
}

function PinLogin({ onDone }: { onDone: () => void }) {
  const login = useAdminLogin();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  return (
    <form className="mx-auto max-w-sm rounded-2xl border bg-card p-6" onSubmit={(e) => { e.preventDefault(); setErr(''); login.mutate({ data: { pin } }, { onSuccess: onDone, onError: (er) => setErr(errStatus(er) === 401 ? 'That PIN is not right.' : errMsg(er)) }); }}>
      <KeyRound className="h-6 w-6 text-[hsl(var(--forest))]" />
      <h2 className="mt-3 font-display text-2xl font-semibold">Admin PIN</h2>
      <Input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={128} className="mt-4 h-12 bg-background text-center text-lg tracking-[0.4em]" data-testid="input-admin-pin" />
      {err && <p className="mt-2 text-sm text-destructive" data-testid="text-admin-error">{err}</p>}
      <Button type="submit" className="mt-4 h-12 w-full font-semibold" disabled={!pin || login.isPending} data-testid="button-admin-login">{login.isPending ? 'Checking...' : 'Open dashboard'}</Button>
    </form>
  );
}

export default function Admin() {
  const qc = useQueryClient();
  const q = useGetAdminDashboard({ query: { queryKey: getGetAdminDashboardQueryKey(), retry: false, refetchInterval: (query) => (query.state.error ? false : 10000) } });
  const vis = useUpdateListingVisibility();
  const agents = useMemo(() => agentStats(q.data?.events ?? []), [q.data?.events]);
  const escalated = useMemo(() => (q.data?.events ?? []).filter((e) => e.kind.includes('escalat') || e.payload?.escalate === true), [q.data?.events]);
  const status = errStatus(q.error);

  const toggle = (id: number, hidden: boolean) =>
    vis.mutate({ id, data: { hidden } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
        qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMarketSummaryQueryKey() });
      },
    });

  return (
    <Page>
      <PageTitle eyebrow="Admin" title="Event desk" right={q.data ? <div className="flex items-center gap-2"><DemoChip /><Button variant="outline" size="sm" className="tap" onClick={() => q.refetch()} data-testid="button-admin-refresh"><RotateCw className="h-4 w-4" /></Button></div> : undefined} />
      {q.isLoading ? <PageSkeleton /> : status === 401 ? (
        <PinLogin onDone={() => qc.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() })} />
      ) : status === 503 ? (
        <ErrorState message="Admin is switched off: ADMIN_PIN is not set on the server." />
      ) : q.isError || !q.data ? <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} /> : (() => {
        const d = q.data;
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              {[['Sign-ups', d.stats.signups], ['Orders', d.stats.orders], ['Tonnes retired', d.stats.tonnes_retired], ['Scans', d.stats.scans], ['QR visits', d.stats.qr_visits], ['Escalated', escalated.length]].map(([k, v]) => (
                <div key={k} className="rounded-xl border bg-card p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="text-2xl font-bold tabular-nums">{num(Number(v))}</div></div>
              ))}
            </div>
            <p className="text-sm"><span className="text-muted-foreground">Integrations: </span><span data-testid="text-integration-status">{d.integration_status}</span></p>

            <section className="rounded-2xl border border-[hsl(var(--leaf)/0.55)] bg-[hsl(var(--leaf)/0.08)] p-5" data-testid="panel-revenue">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-2xl font-semibold">Revenue (demo)</h2><DemoChip /></div>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Fees earned', formatInr(d.revenue.fees_earned_inr)],
                  ['Fees pending', formatInr(d.revenue.fees_pending_inr)],
                  ['Completed voluntary orders', num(d.revenue.completed_voluntary_orders)],
                  ['Credit value traded', formatInr(d.revenue.credit_value_traded_inr)],
                ].map(([label, value], i) => <div key={label} className={`rounded-xl border bg-card p-4 ${i === 3 ? 'border-dashed' : ''}`} data-testid={`revenue-${i}`}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>{i === 3 && <p className="mt-1 text-xs font-semibold text-[hsl(var(--soil))]">Not ZeroCarbon revenue</p>}</div>)}
              </dl>
              <div className="mt-4 border-t border-dashed pt-4"><h3 className="text-sm font-semibold">Plan interest by plan</h3>
                {Object.keys(d.revenue.plan_interest_counts).length ? <ul className="mt-2 flex flex-wrap gap-2">{Object.entries(d.revenue.plan_interest_counts).map(([plan, count]) => <li key={plan} className="rounded-lg border bg-card px-3 py-2 text-sm" data-testid={`interest-count-${plan}`}>{plan.replaceAll('_', ' ')} <strong className="ml-2 tabular-nums">{count}</strong></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No interest recorded yet.</p>}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-semibold">Agent call times and failures</h2>
              {agents.length === 0 ? <p className="text-sm text-muted-foreground">No agent calls logged yet.</p> : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-3">Agent</th><th className="p-3">Calls</th><th className="p-3">Last status</th><th className="p-3">Confidence</th><th className="p-3">Avg ms</th><th className="p-3">Slowest ms</th><th className="p-3">Failures</th></tr></thead>
                    <tbody>{agents.map(([a, s]) => (
                      <tr key={a} className="border-t" data-testid={`row-agent-${a}`}><td className="p-3 font-mono text-xs">{a}</td><td className="p-3">{s.n}</td><td className="p-3">{s.lastStatus}</td><td className="p-3">{s.confidence}</td><td className="p-3">{s.n ? Math.round(s.total / s.n) : 0}</td><td className="p-3 font-semibold">{Math.round(s.max)}</td><td className={`p-3 ${s.fails ? 'font-semibold text-destructive' : ''}`}>{s.fails}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-semibold">Escalated questions</h2>
              {escalated.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                <ul className="space-y-2">{escalated.map((e) => <li key={e.id} className="rounded-xl border bg-card p-3 text-sm"><div className="text-xs text-muted-foreground">{fmtDate(e.created_at)}</div><p>{String(pick(e.payload, ['question', 'text']) ?? JSON.stringify(e.payload))}</p></li>)}</ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-semibold">Listings visibility</h2>
              <ul className="divide-y rounded-xl border bg-card">
                {d.listings.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0"><div className="truncate text-sm font-medium">{l.project_name}</div><div className="text-xs text-muted-foreground">{l.market} · {inr(l.price_inr_per_t)}/t · {l.hidden ? 'Hidden' : 'Visible'}</div></div>
                    <label className="tap flex items-center gap-2 text-xs">
                      Show
                      <Switch checked={!l.hidden} disabled={vis.isPending} onCheckedChange={(v) => toggle(l.id, !v)} data-testid={`switch-visibility-${l.id}`} />
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-3 font-semibold">Orders ({d.orders.length})</h2>
                <ul className="max-h-96 space-y-2 overflow-y-auto">{d.orders.map((o) => <li key={o.id} className="rounded-xl border bg-card p-3 text-sm"><div className="font-medium">{o.listing.project_name}</div><div className="text-xs text-muted-foreground">{num(o.quantity_t)} t · {o.stage} · {fmtDate(o.created_at)}</div></li>)}</ul>
              </section>
              <section>
                <h2 className="mb-3 font-semibold">Organisations ({d.organisations.length})</h2>
                <ul className="max-h-96 space-y-2 overflow-y-auto">{d.organisations.map((o) => <li key={o.id} className="rounded-xl border bg-card p-3 text-sm"><div className="font-medium">{o.organisation_name}</div><div className="text-xs text-muted-foreground">{o.name} · {o.roles.join(', ')}{o.buyer_type ? ` · ${o.buyer_type}` : ''}</div></li>)}</ul>
              </section>
            </div>

            <section>
              <h2 className="mb-3 font-semibold">Recent events</h2>
              <ul className="max-h-[480px] space-y-1.5 overflow-y-auto">
                {d.events.map((e) => (
                  <li key={e.id} className="rounded-lg border bg-card p-2.5 text-xs">
                    <div className="flex justify-between gap-2"><span className="font-semibold">{e.kind}</span><span className="text-muted-foreground">{fmtDate(e.created_at)}</span></div>
                    <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] text-muted-foreground">{JSON.stringify(e.payload)}</pre>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        );
      })()}
    </Page>
  );
}
