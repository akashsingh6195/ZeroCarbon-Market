import {
  useGetLiveStats, getGetLiveStatsQueryKey,
  useGetLiveSubmissions, getGetLiveSubmissionsQueryKey,
} from '@workspace/api-client-react';
import { Logo } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ErrorState } from '@/components/zc/states';
import { Skeleton } from '@/components/ui/skeleton';
import { num } from '@/lib/zc';
import { formatInr } from '@/lib/pricing';

export default function Live() {
  const q = useGetLiveStats({ query: { queryKey: getGetLiveStatsQueryKey(), refetchInterval: 5000 } });
  const real = useGetLiveSubmissions({
    query: { queryKey: getGetLiveSubmissionsQueryKey(), refetchInterval: 60_000, retry: false },
  });
  const url = `${window.location.origin}${import.meta.env.BASE_URL}?src=qr`;
  const submissions = real.data;
  const productCounts = submissions ? [
    ['Buying carbon credits', submissions.product_counts.buying_carbon_credits],
    ['Consultancy service (Rs 299 land review)', submissions.product_counts.consultancy_service],
    ['Listing on ZeroCarbon', submissions.product_counts.listing_on_zerocarbon],
  ] as const : [];
  const relativeTime = (timestamp: string | null) => {
    if (!timestamp) return 'Time unavailable';
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 60_000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} day ago`;
  };
  const updatedLabel = !submissions?.updated_at
    ? 'Waiting for the first sheet refresh.'
    : submissions.stale
      ? `Updated ${Math.max(1, Math.floor((Date.now() - Date.parse(submissions.updated_at)) / 60_000))} min ago`
      : 'Updated just now';
  const tiles = q.data ? [
    { k: 'Sign-ups', v: q.data.signups, c: 'var(--forest)' },
    { k: 'Tonnes retired', v: q.data.tonnes_retired, c: 'var(--leaf)' },
    { k: 'Land scans', v: q.data.scans, c: 'var(--soil)' },
    { k: 'QR visits', v: q.data.qr_visits, c: 'var(--marigold)' },
    { k: 'ZeroCarbon fees earned', v: q.data.fees_earned_inr, c: 'var(--forest)', money: true },
  ] : [];
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[hsl(var(--paper))] p-5 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><Logo /><div className="flex items-center gap-3"><span className="flex items-center gap-2 text-sm font-medium"><span className="pulse-dot h-2.5 w-2.5 rounded-full bg-[hsl(var(--leaf))]" />Live</span><DemoChip size="lg" /></div></div>
      <div className="flex flex-1 flex-col justify-center py-8">
        <section className="mb-6 rounded-3xl border bg-card p-5 md:p-8" data-testid="section-real-submissions">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Real submissions</h2>
            <span className="rounded-full border border-[hsl(var(--leaf)/0.5)] bg-[hsl(var(--leaf)/0.12)] px-3 py-1 text-xs font-bold tracking-wider text-[hsl(var(--forest))]">REAL</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="text-3xl font-bold tabular-nums">{num(submissions?.total_submissions ?? 0)}</div>
              <div className="text-sm text-muted-foreground">Total submissions</div>
            </div>
            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="text-3xl font-bold tabular-nums">{formatInr(submissions?.total_amount_inr ?? 0)}</div>
              <div className="text-sm text-muted-foreground">Total amount received</div>
            </div>
            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="text-3xl font-bold tabular-nums">{submissions?.average_satisfaction == null ? '—' : `${submissions.average_satisfaction} / 5`}</div>
              <div className="text-sm text-muted-foreground">Average payment satisfaction</div>
            </div>
            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="text-sm font-semibold">By product</div>
              <div className="mt-2 space-y-1 text-sm">
                {productCounts.map(([label, count]) => <div key={label} className="flex justify-between gap-2"><span>{label}</span><span className="font-semibold tabular-nums">{num(count)}</span></div>)}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border bg-background/60 p-4">
            <h3 className="text-sm font-semibold">How people heard about us</h3>
            {submissions?.heard_about.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {submissions.heard_about.map(({ source, count }) => <span key={source} className="rounded-full border px-3 py-1 text-xs">{source} · {num(count)}</span>)}
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">No responses yet.</p>}
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border">
            <div className="border-b bg-background/60 px-4 py-3 text-sm font-semibold">10 latest submissions</div>
            {submissions?.latest.length ? submissions.latest.map((item, index) => (
              <div key={`${item.timestamp ?? 'unknown'}-${index}`} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
                <time dateTime={item.timestamp ?? undefined} className="text-xs text-muted-foreground">{relativeTime(item.timestamp)}</time>
                <span className="text-sm font-medium">{item.name}</span>
                <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">{item.product}</span>
                <span className="text-right text-sm font-semibold tabular-nums">{item.amount_inr == null ? '—' : formatInr(item.amount_inr)}</span>
              </div>
            )) : <p className="px-4 py-4 text-sm text-muted-foreground">No submissions yet.</p>}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>From our payment form. Our team checks each payment before confirming.</p>
            <p data-testid="text-real-submissions-updated">{updatedLabel}</p>
          </div>
        </section>
        {q.isLoading ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40" />)}</div>
          : q.isError ? <ErrorState message="Live counters are unavailable." onRetry={() => q.refetch()} /> : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {tiles.map((t, i) => (
              <div key={t.k} className={`rounded-3xl border bg-card p-5 md:p-8 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`} data-testid={`stat-${t.k.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="h-1.5 w-10 rounded-full" style={{ background: `hsl(${t.c})` }} />
                <div key={t.v} className="rise mt-4 text-5xl font-extrabold tabular-nums tracking-tight md:text-7xl">{'money' in t && t.money ? formatInr(Number(t.v)) : num(t.v)}</div>
                <div className="mt-2 text-sm font-medium text-muted-foreground md:text-lg">{t.k}</div>
                {t.k === 'ZeroCarbon fees earned' && <div className="mt-2"><DemoChip /></div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 text-sm text-muted-foreground">
        <p>The counters below are demo data from this event. No money moves.</p>
        <p className="font-mono text-xs break-all">Scan or open: {url}</p>
      </div>
    </div>
  );
}
