import { Link } from 'wouter';
import { ArrowRight, Package } from 'lucide-react';
import { useGetOrders, getGetOrdersQueryKey } from '@workspace/api-client-react';
import { Page, PageTitle } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { CardSkeletons, ErrorState } from '@/components/zc/states';
import { useSession } from '@/lib/session';
import { errMsg, errStatus, fmtDate, inr, num } from '@/lib/zc';

export default function Orders() {
  const { org, isLoading: sLoading } = useSession();
  const q = useGetOrders({ query: { queryKey: getGetOrdersQueryKey(), enabled: !!org, refetchInterval: 5000 } });

  return (
    <Page className="max-w-3xl">
      <PageTitle eyebrow="Orders" title="Your orders" right={<DemoChip />}>Each order moves through its stages like a parcel. Tap one to follow it.</PageTitle>
      {sLoading ? <CardSkeletons n={2} /> : !org ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">Sign up to see orders</p>
          <Link href="/signup" className="tap mt-4 inline-flex items-center rounded-xl bg-[hsl(var(--forest))] px-5 font-semibold text-[hsl(var(--paper))]" data-testid="link-signup-orders">Join the demo</Link>
        </div>
      ) : q.isLoading ? <CardSkeletons n={3} /> : q.isError ? (
        <ErrorState message={errStatus(q.error) === 401 ? 'Your demo session ended. Sign up again.' : errMsg(q.error)} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <div className="rounded-2xl border border-dashed p-10 text-center" data-testid="status-empty">
          <p className="font-display text-2xl">No orders yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Pick a listing, check your wording, and place a demo order.</p>
          <Link href="/market" className="tap mt-4 inline-flex items-center gap-1 rounded-xl bg-[hsl(var(--forest))] px-5 font-semibold text-[hsl(var(--paper))]" data-testid="link-go-market">Go to Market <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {q.data.map((o) => {
            const pct = o.stages.length ? (o.stages_done.length / o.stages.length) * 100 : 0;
            return (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="block rounded-2xl border bg-card p-4 transition-transform hover:-translate-y-0.5" data-testid={`card-order-${o.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{o.listing.project_name}</div>
                      <div className="text-xs text-muted-foreground">{num(o.quantity_t)} t · {inr(o.quantity_t * o.price_inr_per_t)} · {fmtDate(o.created_at)}</div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full origin-left bg-[hsl(var(--leaf))] transition-transform duration-700" style={{ transform: `scaleX(${pct / 100})` }} /></div>
                  <div className="mt-1.5 text-xs font-medium" data-testid={`text-stage-${o.id}`}>{o.stage}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
