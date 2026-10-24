import { useGetLiveStats, getGetLiveStatsQueryKey } from '@workspace/api-client-react';
import { Logo } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ErrorState } from '@/components/zc/states';
import { Skeleton } from '@/components/ui/skeleton';
import { num } from '@/lib/zc';

export default function Live() {
  const q = useGetLiveStats({ query: { queryKey: getGetLiveStatsQueryKey(), refetchInterval: 5000 } });
  const url = `${window.location.origin}${import.meta.env.BASE_URL}?src=qr`;
  const tiles = q.data ? [
    { k: 'Sign-ups', v: q.data.signups, c: 'var(--forest)' },
    { k: 'Orders', v: q.data.orders, c: 'var(--registry)' },
    { k: 'Tonnes retired', v: q.data.tonnes_retired, c: 'var(--leaf)' },
    { k: 'Land scans', v: q.data.scans, c: 'var(--soil)' },
    { k: 'QR visits', v: q.data.qr_visits, c: 'var(--marigold)' },
  ] : [];
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[hsl(var(--paper))] p-5 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><Logo /><div className="flex items-center gap-3"><span className="flex items-center gap-2 text-sm font-medium"><span className="pulse-dot h-2.5 w-2.5 rounded-full bg-[hsl(var(--leaf))]" />Live</span><DemoChip size="lg" /></div></div>
      <div className="flex flex-1 flex-col justify-center py-8">
        {q.isLoading ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}</div>
          : q.isError ? <ErrorState message="Live counters are unavailable." onRetry={() => q.refetch()} /> : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {tiles.map((t, i) => (
              <div key={t.k} className={`rounded-3xl border bg-card p-5 md:p-8 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`} data-testid={`stat-${t.k.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="h-1.5 w-10 rounded-full" style={{ background: `hsl(${t.c})` }} />
                <div key={t.v} className="rise mt-4 text-5xl font-extrabold tabular-nums tracking-tight md:text-7xl">{num(t.v)}</div>
                <div className="mt-2 text-sm font-medium text-muted-foreground md:text-lg">{t.k}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 text-sm text-muted-foreground">
        <p>All numbers are demo data from this event. No money moves.</p>
        <p className="font-mono text-xs break-all">Scan or open: {url}</p>
      </div>
    </div>
  );
}
