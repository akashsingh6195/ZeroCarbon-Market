import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, CalendarClock, MapPin } from 'lucide-react';
import { useGetListing, getGetListingQueryKey, getGetAdminDashboardQueryKey, useRecordPlanInterest } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Page } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ListingLabels } from '@/components/zc/listing-card';
import { ScoreRing } from '@/components/zc/score';
import { PinMap } from '@/components/zc/leaflet-map';
import { ErrorState, NoMoneyNote, PageSkeleton } from '@/components/zc/states';
import { errMsg, errStatus, inr, num } from '@/lib/zc';
import { formatFeeRate, formatInr, formatPriceRange, pricing } from '@/lib/pricing';
import { useSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const nid = Number(id);
  const qc = useQueryClient();
  const session = useSession();
  const interest = useRecordPlanInterest();
  const [requested, setRequested] = useState(false);
  const q = useGetListing(nid, { query: { queryKey: getGetListingQueryKey(nid), enabled: Number.isFinite(nid) } });

  return (
    <Page>
      <Link href="/market" className="tap -ml-2 mb-2 inline-flex items-center gap-1 px-2 text-sm text-muted-foreground" data-testid="link-back-market"><ArrowLeft className="h-4 w-4" /> Market</Link>
      {q.isLoading ? <PageSkeleton /> : q.isError || !q.data ? (
        <ErrorState message={errStatus(q.error) === 404 ? 'This listing is not available.' : errMsg(q.error)} onRetry={() => q.refetch()} />
      ) : (() => {
        const l = q.data;
        const buyable = l.status === 'issued';
        const ownsListing = !!session.org?.id && session.org.id === l.seller_org_id;
        const feeRate = (l.market === 'voluntary' || l.market === 'authorised') ? pricing.deal_fee.standard_rate : 0;
        return (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-5">
              <div className="rise">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{l.region}</div>
                <h1 className="mt-1 font-display text-3xl font-semibold leading-tight md:text-4xl" data-testid="text-project-name">{l.project_name}</h1>
                <div className="mt-3"><ListingLabels l={l} /></div>
              </div>
              <PinMap lat={l.lat} lon={l.lon} label={l.project_name} className="h-64 w-full overflow-hidden rounded-2xl border md:h-80" />
              <p className="text-xs text-muted-foreground">Pin shows the approximate project area. Location is fictional.</p>
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-semibold">About this project</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed" data-testid="text-description">{l.description}</p>
              </div>
            </div>
            <aside className="md:sticky md:top-20 md:self-start">
              <div className="rounded-2xl border bg-card p-5 shadow-md">
                <div className="flex items-center justify-between"><DemoChip /><span className="font-mono text-xs text-muted-foreground">#{l.id}</span></div>
                <div className="mt-4 flex items-center gap-4">
                  <ScoreRing score={l.zerocarbon_score} size={72} />
                  <div>
                    <div className="text-xs text-muted-foreground">ZeroCarbon Score</div>
                    <div className="text-sm">Our label check on method, registry and evidence. Out of 100.</div>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-dashed pt-4 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Price</dt><dd className="text-xl font-bold" data-testid="text-price">{inr(l.price_inr_per_t)}<span className="text-xs font-normal"> / t</span></dd></div>
                  <div><dt className="text-xs text-muted-foreground">Available</dt><dd className="text-xl font-bold">{num(l.quantity_t)} t</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Registry</dt><dd>{l.registry}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Method</dt><dd>{l.method}</dd></div>
                </dl>
                 {ownsListing && <div className="mt-4 rounded-xl border border-[hsl(var(--leaf)/0.5)] bg-[hsl(var(--leaf)/0.1)] p-3 text-sm" data-testid="text-seller-fee-disclosure">
                   <p>{feeRate > 0 ? `Listing is free. When a deal completes, ZeroCarbon keeps ${formatFeeRate(feeRate)} and you receive the rest.` : 'Listing is free. No ZeroCarbon fee for this market.'}</p>
                  <p className="mt-1 font-semibold">At {formatInr(l.price_inr_per_t)} a tonne you receive about {formatInr(l.price_inr_per_t * (1 - feeRate))} a tonne.</p>
                </div>}
                {l.status === 'future' && (
                  <p className="mt-4 flex items-start gap-2 rounded-lg bg-[hsl(var(--marigold)/0.15)] p-3 text-sm"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />Future credits are not made yet. Expected delivery {l.delivery_year ?? 'to be confirmed'}. Buying opens when they are issued.</p>
                )}
                {l.status === 'retired' && <p className="mt-4 rounded-lg bg-secondary p-3 text-sm">These credits are already retired and cannot be bought.</p>}
                {buyable ? (
                  <Link href={`/buy/${l.id}`} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--forest))] font-semibold text-[hsl(var(--paper))]" data-testid="link-buy">
                    Buy <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button disabled className="mt-5 h-12 w-full cursor-not-allowed rounded-xl bg-muted font-semibold text-muted-foreground" data-testid="button-buy-disabled">Not available to buy</button>
                )}
                {l.status !== 'retired' && <div className="mt-4 border-t border-dashed pt-4" data-testid="section-due-diligence">
                  <p className="text-sm text-muted-foreground">Need a deeper check? Due-diligence report: {formatPriceRange(pricing.services.due_diligence_min_inr, pricing.services.due_diligence_max_inr)} per project, quoted first.</p>
                  {requested ? <p role="status" className="mt-2 text-sm font-semibold text-[hsl(var(--forest))]" data-testid="status-report-request">Thanks, we will get in touch. Demo: nothing is charged.</p> : <Button variant="outline" className="tap mt-3 w-full" disabled={interest.isPending} onClick={() => interest.mutate({ data: { plan: 'due_diligence', listing_id: l.id } }, { onSuccess: () => { setRequested(true); qc.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }); } })} data-testid="button-request-report">Request a report</Button>}
                  {interest.isError && <p role="alert" className="mt-2 text-sm text-destructive">{errMsg(interest.error, 'Could not save your request. Please try again.')}</p>}
                </div>}
                <NoMoneyNote className="mt-3" />
              </div>
            </aside>
          </div>
        );
      })()}
    </Page>
  );
}
