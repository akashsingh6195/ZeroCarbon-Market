import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Sparkles, X, SlidersHorizontal, Columns3, Info } from 'lucide-react';
import {
  useGetListings, getGetListingsQueryKey, useInterpretNeed,
  type GetListingsParams, type Listing, type NeedResult,
} from '@workspace/api-client-react';
import { Page, PageTitle } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ListingCard } from '@/components/zc/listing-card';
import { CardSkeletons, ErrorState } from '@/components/zc/states';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSession } from '@/lib/session';
import { ACTION_LABEL, MARKET_LABEL, STATUS_LABEL, errMsg, inr } from '@/lib/zc';

type F = { market: string; action: string; status: string; vintage_from: string; max_price: string; region: string };
const EMPTY: F = { market: '', action: '', status: '', vintage_from: '', max_price: '', region: '' };

function Sel({ label, value, onChange, options, id }: { label: string; value: string; onChange: (v: string) => void; options: Record<string, string>; id: string }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground" data-testid={`select-${id}`}>
        <option value="">Any</option>
        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </label>
  );
}

function filterMatches(l: Listing, f: Record<string, unknown>) {
  for (const [k, v] of Object.entries(f)) {
    if (v === null || v === undefined || v === '') continue;
    if (k === 'market' && l.market !== v) return false;
    if (k === 'action' && l.action !== v) return false;
    if (k === 'status' && l.status !== v) return false;
    if (k === 'vintage_from' && l.vintage < Number(v)) return false;
    if (k === 'max_price' && l.price_inr_per_t > Number(v)) return false;
    if (k === 'region' && !l.region.toLowerCase().includes(String(v).toLowerCase())) return false;
    if (k === 'quantity_t' && l.quantity_t < Number(v)) return false;
  }
  return true;
}

export default function Market() {
  const { isTrader, isObligated, org } = useSession();
  const [f, setF] = useState<F>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);
  const [compare, setCompare] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [sentence, setSentence] = useState('');
  const [need, setNeed] = useState<NeedResult | null>(null);
  const [needFilters, setNeedFilters] = useState<Record<string, unknown>>({});
  const interpret = useInterpretNeed();

  const params = useMemo(() => {
    const active = need?.available ? needFilters : f;
    const p: GetListingsParams = {};
    if (active.market) p.market = String(active.market);
    if (active.action) p.action = String(active.action);
    if (active.status) p.status = String(active.status);
    if (active.vintage_from) p.vintage_from = Number(active.vintage_from);
    if (active.max_price) p.max_price = Number(active.max_price);
    if (typeof active.region === 'string' && active.region.trim()) p.region = active.region.trim();
    return Object.keys(p).length ? p : undefined;
  }, [f, need?.available, needFilters]);

  const listings = useGetListings(params, { query: { queryKey: getGetListingsQueryKey(params) } });
  const all = useGetListings(undefined, { query: { queryKey: getGetListingsQueryKey() } });
  const byId = useMemo(() => new Map((all.data ?? []).concat(listings.data ?? []).map((l) => [l.id, l])), [all.data, listings.data]);
  const compared = compare.map((id) => byId.get(id)).filter(Boolean) as Listing[];
  const activeCount = Object.values(need?.available ? needFilters : f).filter(Boolean).length;

  const runNeed = () => {
    if (!sentence.trim()) return;
    interpret.mutate({ data: { sentence: sentence.trim() } }, {
      onSuccess: (r) => { setNeed(r); setNeedFilters(r.filters ?? {}); },
      onError: (e) => { setNeed({ available: false, message: errMsg(e, 'Our assistant is busy, use the filters'), understood: '', filters: {}, ranked: [] }); setNeedFilters({}); },
    });
  };

  const applyNeedToFilters = () => {
    const n: F = { ...EMPTY };
    for (const k of Object.keys(EMPTY) as (keyof F)[]) {
      const v = needFilters[k];
      if (v !== undefined && v !== null && v !== '') n[k] = String(v);
    }
    setF(n);
    setShowFilters(true);
  };

  const toggleCompare = (id: number, v: boolean) => setCompare((c) => (v ? (c.length >= 3 ? c : [...c, id]) : c.filter((x) => x !== id)));
  const gridListings = (listings.data ?? []).filter((l) => !need?.available || filterMatches(l, needFilters));

  const markets = isTrader ? { voluntary: MARKET_LABEL.voluntary } : isObligated ? { india_compliance: MARKET_LABEL.india_compliance } : MARKET_LABEL;
  const rankReasons = new Map((need?.ranked ?? []).map((item) => [item.listing.id, item.why]));
  const rankedVisible = gridListings.map((listing) => ({
    listing,
    why: rankReasons.get(listing.id) ?? "Matches your requested filters.",
  }));

  return (
    <Page>
      <PageTitle eyebrow="Market" title="Credits with their labels showing" right={<DemoChip />}>
        Filter by any label, tick up to three to compare, or just tell us what you need.
      </PageTitle>

      {(isTrader || isObligated) && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-[hsl(var(--registry)/0.3)] bg-[hsl(var(--registry)/0.06)] p-3 text-sm" data-testid="text-role-scope">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--registry))]" />
          {isTrader ? 'Traders deal in voluntary credits only, so only voluntary listings show here.' : 'Your plant has a CCTS target, so only India compliance listings show here. Compliance buying opens with ZeroCarbon Comply.'}
        </div>
      )}

      {/* Need box */}
      <section className="mb-6 rounded-2xl border bg-[hsl(var(--forest))] p-4 text-[hsl(var(--paper))] md:p-5">
        <label htmlFor="need" className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-[hsl(var(--marigold))]" /> Tell us what you need</label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Textarea
            id="need"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runNeed(); } }}
            maxLength={1000}
            rows={2}
            placeholder="500 tonnes of removals from India, 2024 or newer, under 1,200"
            className="min-h-[44px] resize-none border-transparent bg-[hsl(var(--paper))] text-[hsl(var(--ink))]"
            data-testid="input-need"
          />
          <Button onClick={runNeed} disabled={!sentence.trim() || interpret.isPending} className="tap h-auto min-h-11 bg-[hsl(var(--marigold))] font-semibold text-[hsl(var(--ink))] hover:bg-[hsl(var(--marigold)/0.9)]" data-testid="button-need">
            {interpret.isPending ? 'Reading...' : 'Find matches'}
          </Button>
        </div>
      </section>

      {need && (
        <section className="mb-8 rounded-2xl border bg-card p-4 md:p-5" data-testid="section-need-result">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {need.available ? (
                <>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">We understood</div>
                  <p className="mt-1 font-medium" data-testid="text-understood">{need.understood}</p>
                </>
              ) : (
                <p className="font-medium" data-testid="text-need-unavailable">{need.message || 'Our assistant is busy, use the filters'}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="tap shrink-0" onClick={() => setNeed(null)} aria-label="Close" data-testid="button-need-close"><X className="h-4 w-4" /></Button>
          </div>
          {need.available && (
            <>
              {need.message && <p className="mt-3 text-sm font-medium" data-testid="text-need-fallback">{need.message}</p>}
              {needFilters.compliance_unavailable === true && (
                <p className="mt-2 text-sm" data-testid="text-need-comply">
                  Obligated plant? Use ZeroCarbon Comply to plan your purchases.{' '}
                  <Link href="/comply" className="font-semibold underline">Go to ZeroCarbon Comply</Link>
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(needFilters).filter(([k, v]) => k !== 'compliance_unavailable' && v !== null && v !== undefined && v !== '').map(([k, v]) => (
                  <button key={k} onClick={() => setNeedFilters((nf) => { const n = { ...nf }; delete n[k]; return n; })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border bg-secondary px-3 text-xs font-medium" data-testid={`chip-need-filter-${k}`}>
                    {k === 'quantity_t' ? 'tonnes required' : k.replace('_', ' ')}: {String(MARKET_LABEL[String(v)] ?? ACTION_LABEL[String(v)] ?? STATUS_LABEL[String(v)] ?? v)} <X className="h-3 w-3" />
                  </button>
                ))}
                <Button variant="outline" size="sm" className="min-h-9" onClick={applyNeedToFilters} data-testid="button-apply-need">Use as filters</Button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rankedVisible.length === 0 ? <p className="text-sm text-muted-foreground">No ranked listings match those filters.</p> :
                  rankedVisible.map((r) => <ListingCard key={r.listing.id} l={r.listing} why={r.why} compareChecked={compare.includes(r.listing.id)} compareDisabled={compare.length >= 3} onCompare={(v) => toggleCompare(r.listing.id, v)} />)}
              </div>
            </>
          )}
        </section>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="outline" className="tap" onClick={() => setShowFilters((s) => !s)} data-testid="button-toggle-filters">
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters{activeCount ? ` (${activeCount})` : ''}
        </Button>
        <span className="text-sm text-muted-foreground" data-testid="text-result-count">{listings.data ? `${gridListings.length} listings` : ''}</span>
      </div>
      {showFilters && (
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border bg-card p-4 md:grid-cols-6">
          <Sel id="market" label="Market" value={f.market} onChange={(v) => setF({ ...f, market: v })} options={markets} />
          <Sel id="action" label="Action" value={f.action} onChange={(v) => setF({ ...f, action: v })} options={ACTION_LABEL} />
          <Sel id="status" label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={STATUS_LABEL} />
          <Sel id="vintage" label="Vintage from" value={f.vintage_from} onChange={(v) => setF({ ...f, vintage_from: v })} options={{ 2023: '2023', 2024: '2024', 2025: '2025', 2026: '2026' }} />
          <label className="block text-xs font-medium text-muted-foreground">Max price (Rs/t)
            <Input type="number" inputMode="numeric" min={0} value={f.max_price} onChange={(e) => setF({ ...f, max_price: e.target.value })} className="mt-1 h-11 bg-card" data-testid="input-max-price" />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">Region
            <Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} placeholder="e.g. Karnataka" className="mt-1 h-11 bg-card" data-testid="input-region" />
          </label>
          {activeCount > 0 && <Button variant="ghost" className="tap col-span-2 md:col-span-6 md:justify-self-start" onClick={() => setF(EMPTY)} data-testid="button-clear-filters">Clear filters</Button>}
        </div>
      )}

      {listings.isLoading ? <CardSkeletons n={6} /> : listings.isError ? (
        <ErrorState message={errMsg(listings.error, 'Could not load listings.')} onRetry={() => listings.refetch()} />
      ) : listings.data && gridListings.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center" data-testid="status-empty">
          <p className="font-display text-2xl">Nothing matches those labels.</p>
          <p className="mt-2 text-sm text-muted-foreground">Try a higher price limit or an earlier vintage.</p>
          <Button variant="outline" className="tap mt-4" onClick={() => setF(EMPTY)}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gridListings.map((l) => <ListingCard key={l.id} l={l} compareChecked={compare.includes(l.id)} compareDisabled={compare.length >= 3} onCompare={(v) => toggleCompare(l.id, v)} />)}
        </div>
      )}

      {!org && <p className="mt-8 text-center text-sm text-muted-foreground">Browsing as a guest. <Link href="/signup" className="font-semibold text-[hsl(var(--forest))] underline">Join the demo</Link> to buy.</p>}

      {compare.length > 0 && (
        <div className="fixed inset-x-3 bottom-[156px] z-40 mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl bg-[hsl(var(--ink))] p-2 pl-4 text-[hsl(var(--paper))] shadow-xl md:bottom-24">
          <span className="text-sm">{compare.length} of 3 ticked</span>
          <div className="flex gap-1">
            <Button variant="ghost" className="tap text-[hsl(var(--paper))] hover:bg-white/10 hover:text-[hsl(var(--paper))]" onClick={() => setCompare([])} data-testid="button-compare-clear">Clear</Button>
            <Button className="tap bg-[hsl(var(--marigold))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--marigold)/0.9)]" onClick={() => setCompareOpen(true)} disabled={compare.length < 2} data-testid="button-compare-open">
              <Columns3 className="mr-1.5 h-4 w-4" /> Compare
            </Button>
          </div>
        </div>
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto bg-[hsl(var(--paper))]">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">Side by side <DemoChip /></DialogTitle>
            <DialogDescription>Fictional listings, compared on the same labels.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2" style={{ gridTemplateColumns: `minmax(64px,auto) repeat(${compared.length}, minmax(0,1fr))` }} data-testid="table-compare">
            <div />
            {compared.map((l) => <Link key={l.id} href={`/listings/${l.id}`} className="text-sm font-semibold leading-snug hover:underline break-words">{l.project_name}</Link>)}
            {([
              ['Price / t', (l: Listing) => inr(l.price_inr_per_t)],
              ['Score', (l: Listing) => `${l.zerocarbon_score}/100`],
              ['Vintage', (l: Listing) => String(l.vintage)],
              ['Status', (l: Listing) => STATUS_LABEL[l.status] ?? l.status],
              ['Delivery', (l: Listing) => (l.status === 'future' ? String(l.delivery_year ?? 'TBC') : 'Now')],
              ['Action', (l: Listing) => ACTION_LABEL[l.action] ?? l.action],
            ] as const).map(([k, fn]) => (
              <div key={k} className="contents">
                <div className="border-t py-2 text-xs text-muted-foreground">{k}</div>
                {compared.map((l) => <div key={l.id} className="border-t py-2 text-sm font-medium tabular-nums">{fn(l)}</div>)}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
