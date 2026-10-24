import { Link } from 'wouter';
import { ArrowRight, ScanLine, ShieldCheck, Tag, FileCheck2, Satellite } from 'lucide-react';
import { useGetListings, useGetMarketSummary, getGetListingsQueryKey, getGetMarketSummaryQueryKey } from '@workspace/api-client-react';
import { Page } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ListingCard } from '@/components/zc/listing-card';
import { CardSkeletons, ErrorState, NoMoneyNote } from '@/components/zc/states';
import { LabelChip } from '@/components/zc/label-chip';
import { Skeleton } from '@/components/ui/skeleton';
import { IMG, inr, num } from '@/lib/zc';

export default function Home() {
  const summary = useGetMarketSummary({ query: { queryKey: getGetMarketSummaryQueryKey() } });
  const listings = useGetListings(undefined, { query: { queryKey: getGetListingsQueryKey() } });
  const preview = [...(listings.data ?? [])].sort((a, b) => b.zerocarbon_score - a.zerocarbon_score).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <img src={IMG('hero-land.jpg')} alt="Young tree rows on red soil farmland in Karnataka" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(154_30%_8%/0.35)] via-[hsl(154_30%_8%/0.55)] to-[hsl(var(--paper))]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 md:pb-24 md:pt-28">
          <div className="rise"><DemoChip className="bg-[hsl(var(--paper)/0.9)]" /></div>
          <h1 className="rise rise-1 mt-4 max-w-3xl font-display text-[2.4rem] font-semibold leading-[1.05] text-[hsl(var(--paper))] md:text-7xl" data-testid="text-headline">
            Know what you’re buying. Know what your land can earn.
          </h1>
          <p className="rise rise-2 mt-5 max-w-xl text-base text-[hsl(var(--paper)/0.9)] md:text-lg">
            Indian carbon credits with every label in plain sight: which market, what action, which registry, when it was made. And a satellite check for your land in Karnataka.
          </p>
          <div className="rise rise-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/market" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--marigold))] px-6 font-semibold text-[hsl(var(--ink))] shadow-lg transition-transform hover:-translate-y-0.5" data-testid="link-buy-credits">
              Buy credits <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/scan" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--paper)/0.6)] bg-[hsl(var(--paper)/0.12)] px-6 font-semibold text-[hsl(var(--paper))] backdrop-blur transition-transform hover:-translate-y-0.5" data-testid="link-check-land">
              <ScanLine className="h-4 w-4" /> Check my land
            </Link>
          </div>
        </div>
      </section>

      <Page className="space-y-16 pt-0 md:pt-0">
        {/* Ledger strip */}
        <section className="rise rise-4 -mt-6 rounded-2xl border bg-card p-4 shadow-md md:p-6" data-testid="section-summary">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--soil))]">Market today</span>
            <DemoChip />
          </div>
          {summary.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : summary.isError || !summary.data ? (
            <ErrorState message="Could not load the market summary." onRetry={() => summary.refetch()} />
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
              {[
                ['Open listings', num(summary.data.listings)],
                ['Tonnes on offer', num(summary.data.available_tonnes)],
                ['Regions', num(summary.data.regions)],
                ['Price range / t', `${inr(summary.data.min_price)} to ${num(summary.data.max_price)}`],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 truncate text-xl font-bold tabular-nums md:text-2xl">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* Label legend */}
        <section className="grid gap-8 md:grid-cols-[1fr_1.3fr] md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold">Six labels on every credit.</h2>
            <p className="mt-3 text-muted-foreground">No mystery bundles. Each listing tells you what it is before it tells you the price.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { t: 'Market', d: 'Indian compliance, Indian offset, voluntary or authorised.', c: <LabelChip tone="registry">India offset</LabelChip> },
              { t: 'Action', d: 'Removal pulls carbon out. Reduction and avoidance keep it out.', c: <LabelChip tone="leaf">Removal</LabelChip> },
              { t: 'Status', d: 'Future credits are not made yet. Issued can be bought. Retired is used.', c: <LabelChip tone="marigold">Future</LabelChip> },
              { t: 'Vintage, method, registry', d: 'The year it was made, how it was counted, and who keeps the record.', c: <LabelChip>Vintage 2024</LabelChip> },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{x.t}</span>{x.c}</div>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--soil))]">Marketplace preview</div>
              <h2 className="font-display text-3xl font-semibold">Highest scored right now</h2>
            </div>
            <Link href="/market" className="tap hidden items-center gap-1 text-sm font-semibold text-[hsl(var(--forest))] sm:inline-flex" data-testid="link-see-all">See all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {listings.isLoading ? <CardSkeletons /> : listings.isError ? (
            <ErrorState message="Could not load listings." onRetry={() => listings.refetch()} />
          ) : preview.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No listings visible right now.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">{preview.map((l) => <ListingCard key={l.id} l={l} />)}</div>
          )}
          <Link href="/market" className="tap mt-4 flex items-center justify-center gap-1 rounded-xl border text-sm font-semibold sm:hidden" data-testid="link-see-all-mobile">See all listings <ArrowRight className="h-4 w-4" /></Link>
        </section>

        {/* Land */}
        <section className="overflow-hidden rounded-3xl bg-[hsl(var(--soil))] text-[hsl(var(--paper))] md:grid md:grid-cols-2">
          <img src={IMG('aerial-plots.jpg')} alt="Aerial view of farm plots" className="h-56 w-full object-cover md:h-full" />
          <div className="p-6 md:p-10">
            <Satellite className="h-6 w-6 text-[hsl(var(--marigold))]" />
            <h2 className="mt-3 font-display text-3xl font-semibold">Own land in Karnataka?</h2>
            <p className="mt-3 text-[hsl(var(--paper)/0.85)]">Drop a pin or trace your boundary on a satellite map. We tell you what could grow there, a range of credits it might make, and what satellites cannot see.</p>
            <Link href="/scan" className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[hsl(var(--paper))] px-5 font-semibold text-[hsl(var(--soil))]" data-testid="link-scan-cta">
              <ScanLine className="h-4 w-4" /> Check my land
            </Link>
          </div>
        </section>

        {/* Journey */}
        <section>
          <h2 className="font-display text-3xl font-semibold">From choice to certificate</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { i: Tag, t: 'Pick by label', d: 'Filter, compare up to three, or describe what you need in a sentence.' },
              { i: ShieldCheck, t: 'Check your words', d: 'Before paying, see the wording you are allowed to use about the purchase.' },
              { i: Package2, t: 'Demo payment', d: 'A pretend payment screen. No money moves.' },
              { i: FileCheck2, t: 'Track and share', d: 'Watch each stage like a parcel, then share the demo certificate.' },
            ].map((s, k) => (
              <li key={s.t} className="relative rounded-2xl border bg-card p-5">
                <span className="font-mono text-xs text-muted-foreground">0{k + 1}</span>
                <s.i className="mt-2 h-5 w-5 text-[hsl(var(--forest))]" />
                <div className="mt-2 font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-dashed border-[hsl(var(--marigold))] bg-[hsl(var(--marigold)/0.08)] p-5">
          <div className="flex flex-wrap items-center gap-3"><DemoChip /><span className="font-semibold">What this demo is, and is not</span></div>
          <NoMoneyNote className="mt-2 text-sm" />
          <p className="mt-2 text-sm text-muted-foreground">Buying credits does not make anyone zero carbon. It funds a specific, labelled piece of work, and you can say exactly that.</p>
        </section>
      </Page>
    </>
  );
}

function Package2(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" />
    </svg>
  );
}
