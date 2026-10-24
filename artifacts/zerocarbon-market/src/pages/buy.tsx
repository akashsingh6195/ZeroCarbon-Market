import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, AlertTriangle, Lock } from 'lucide-react';
import {
  useGetListing, getGetListingQueryKey, useCheckClaim, useCreateOrder,
  getGetOrdersQueryKey, getGetListingsQueryKey, getGetMarketSummaryQueryKey, getGetLiveStatsQueryKey, type ClaimResult,
} from '@workspace/api-client-react';
import { Page } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ErrorState, NoMoneyNote, PageSkeleton } from '@/components/zc/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/session';
import { errMsg, inr, num } from '@/lib/zc';
import { cn } from '@/lib/utils';

const STEPS = ['Tonnes and wording', 'Check wording', 'Demo payment'];

export default function Buy() {
  const { id } = useParams<{ id: string }>();
  const nid = Number(id);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const session = useSession();
  const q = useGetListing(nid, { query: { queryKey: getGetListingQueryKey(nid), enabled: Number.isFinite(nid) } });
  const check = useCheckClaim();
  const create = useCreateOrder();
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState('1');
  const [claim, setClaim] = useState('');
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [useAllowed, setUseAllowed] = useState(true);
  const [err, setErr] = useState('');

  if (q.isLoading || session.isLoading) return <Page className="max-w-2xl"><PageSkeleton /></Page>;
  if (q.isError || !q.data) return <Page className="max-w-2xl"><ErrorState message={errMsg(q.error, 'Listing not found.')} onRetry={() => q.refetch()} /></Page>;
  const l = q.data;
  const t = Number(qty);
  const qtyOk = Number.isFinite(t) && t > 0 && t <= l.quantity_t;
  const total = qtyOk ? t * l.price_inr_per_t : 0;
  const finalClaim = result && useAllowed ? result.allowed_wording : claim;

  if (!session.org) {
    return (
      <Page className="max-w-xl">
        <div className="rounded-2xl border bg-card p-6 text-center">
          <Lock className="mx-auto h-6 w-6 text-[hsl(var(--forest))]" />
          <h1 className="mt-3 font-display text-2xl font-semibold">Join the demo to buy</h1>
          <p className="mt-2 text-sm text-muted-foreground">A quick sign-up, no password. Then come back to {l.project_name}.</p>
          <Link href="/signup" className="mt-5 inline-flex h-12 items-center rounded-xl bg-[hsl(var(--forest))] px-6 font-semibold text-[hsl(var(--paper))]" data-testid="link-signup-to-buy">Sign up</Link>
        </div>
      </Page>
    );
  }
  if (l.status !== 'issued') {
    return <Page className="max-w-xl"><ErrorState message={l.status === 'future' ? 'Future credits are not issued yet, so they cannot be bought.' : 'These credits are already retired.'} /></Page>;
  }

  const doCheck = () => {
    setErr('');
    if (!qtyOk) { setErr(`Choose between 1 and ${num(l.quantity_t)} tonnes.`); return; }
    check.mutate({ data: { listing_id: l.id, quantity_t: t, claim_text: claim.trim() } }, {
      onSuccess: (r) => { setResult(r); setUseAllowed(true); setStep(1); },
      onError: (e) => setErr(errMsg(e)),
    });
  };

  const pay = () => {
    setErr('');
    create.mutate({ data: { listing_id: l.id, quantity_t: t, claim_text: finalClaim, demo_payment_approved: true } }, {
      onSuccess: (o) => {
        qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetListingQueryKey(l.id) });
        qc.invalidateQueries({ queryKey: getGetMarketSummaryQueryKey() });
        qc.invalidateQueries({ queryKey: getGetLiveStatsQueryKey() });
        navigate(`/orders/${o.id}`);
      },
      onError: (e) => setErr(errMsg(e)),
    });
  };

  return (
    <Page className="max-w-2xl">
      <Link href={`/listings/${l.id}`} className="tap -ml-2 inline-flex items-center gap-1 px-2 text-sm text-muted-foreground" data-testid="link-back-listing"><ArrowLeft className="h-4 w-4" /> Listing</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold md:text-3xl">{l.project_name}</h1>
        <DemoChip />
      </div>
      <p className="text-sm text-muted-foreground">{inr(l.price_inr_per_t)} per tonne · vintage {l.vintage} · {num(l.quantity_t)} t available</p>

      <ol className="my-6 grid grid-cols-3 gap-2" data-testid="steps-buy">
        {STEPS.map((s, i) => (
          <li key={s} className="text-xs">
            <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-[hsl(var(--forest))]' : 'bg-border')} />
            <div className={cn('mt-1.5', i === step ? 'font-semibold' : 'text-muted-foreground')}>{s}</div>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-5 rise">
          <label className="block text-sm font-medium">How many tonnes?
            <div className="mt-1 flex items-center gap-2">
              <Button type="button" variant="outline" className="tap h-12 w-12 text-lg" onClick={() => setQty(String(Math.max(1, (Number(qty) || 1) - 1)))} data-testid="button-qty-minus">-</Button>
              <Input type="number" inputMode="decimal" min={0} value={qty} onChange={(e) => setQty(e.target.value)} className="h-12 bg-card text-center text-lg font-bold" data-testid="input-quantity" />
              <Button type="button" variant="outline" className="tap h-12 w-12 text-lg" onClick={() => setQty(String((Number(qty) || 0) + 1))} data-testid="button-qty-plus">+</Button>
            </div>
          </label>
          <label className="block text-sm font-medium">How will you describe this purchase?
            <Textarea value={claim} onChange={(e) => setClaim(e.target.value)} maxLength={2000} rows={4} placeholder="e.g. We funded the retirement of 1 tonne of tree-planting credits in Chikkaballapur." className="mt-1 bg-card" data-testid="input-claim" />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">We check your words before you pay, so what you say matches what you bought.</span>
          </label>
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <span className="text-sm text-muted-foreground">Demo total</span>
            <span className="text-2xl font-bold tabular-nums" data-testid="text-total">{inr(total)}</span>
          </div>
          {err && <p className="text-sm text-destructive" data-testid="text-buy-error">{err}</p>}
          <Button onClick={doCheck} disabled={check.isPending} className="h-12 w-full text-base font-semibold" data-testid="button-check-claim">{check.isPending ? 'Checking wording...' : 'Check my wording'}</Button>
        </div>
      )}

      {step === 1 && result && (
        <div className="space-y-4 rise">
          {result.flagged_phrases.length > 0 && (
            <div className="rounded-xl border border-[hsl(var(--marigold))] bg-[hsl(var(--marigold)/0.12)] p-4" data-testid="section-flagged">
              <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Words we cannot let you use</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{result.flagged_phrases.map((p) => <span key={p} className="rounded-md bg-card px-2 py-0.5 text-sm line-through decoration-[hsl(var(--destructive))]">{p}</span>)}</div>
            </div>
          )}
          {result.fallback && <p className="text-xs text-muted-foreground">Our wording checker was busy, so this is our standard sentence.</p>}
          <button onClick={() => setUseAllowed(true)} className={cn('w-full rounded-xl border p-4 text-left', useAllowed ? 'border-[hsl(var(--forest))] bg-[hsl(var(--forest)/0.06)]' : 'bg-card')} data-testid="button-use-allowed">
            <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--forest))]">Wording you can use</div>
            <p className="mt-1 font-medium" data-testid="text-allowed-wording">{result.allowed_wording}</p>
          </button>
          {claim.trim() && result.flagged_phrases.length === 0 && (
            <button onClick={() => setUseAllowed(false)} className={cn('w-full rounded-xl border p-4 text-left', !useAllowed ? 'border-[hsl(var(--forest))] bg-[hsl(var(--forest)/0.06)]' : 'bg-card')} data-testid="button-use-own">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keep my own words</div>
              <p className="mt-1">{claim}</p>
            </button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="tap h-12 flex-1" onClick={() => setStep(0)} data-testid="button-back-step">Edit</Button>
            <Button className="h-12 flex-[2] font-semibold" onClick={() => setStep(2)} data-testid="button-to-payment">Continue to demo payment</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rise">
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[hsl(var(--marigold))] bg-card p-5">
            <div className="absolute -right-8 top-6 rotate-45 bg-[hsl(var(--marigold))] px-10 py-1 text-[10px] font-bold uppercase tracking-widest">Demo</div>
            <h2 className="font-display text-2xl font-semibold" data-testid="text-demo-payment">Demo payment. No money moves.</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Credits</dt><dd className="text-right">{num(t)} t, {l.project_name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Price</dt><dd>{inr(l.price_inr_per_t)} / t</dd></div>
              <div className="flex justify-between border-t border-dashed pt-2 text-base font-bold"><dt>Demo total</dt><dd>{inr(total)}</dd></div>
            </dl>
            <div className="mt-4 rounded-lg bg-secondary p-3 text-sm"><span className="text-xs text-muted-foreground">Your wording</span><p className="mt-0.5">{finalClaim}</p></div>
          </div>
          <NoMoneyNote />
          {err && <p className="rounded-lg bg-[hsl(var(--destructive)/0.08)] p-3 text-sm text-destructive" data-testid="text-pay-error">{err}</p>}
          <div className="flex gap-2">
            <Button variant="outline" className="tap h-12 flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="h-12 flex-[2] bg-[hsl(var(--marigold))] font-semibold text-[hsl(var(--ink))] hover:bg-[hsl(var(--marigold)/0.9)]" onClick={pay} disabled={create.isPending} data-testid="button-pay">
              {create.isPending ? 'Placing order...' : <><Check className="mr-1.5 h-4 w-4" /> Pay (demo)</>}
            </Button>
          </div>
        </div>
      )}
    </Page>
  );
}
