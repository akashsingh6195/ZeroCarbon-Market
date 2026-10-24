import { useState } from 'react';
import { MapPin, PenLine, Undo2, Trash2, Sprout, Coins, Footprints, EyeOff, ScanLine } from 'lucide-react';
import { useScanLand, getGetLiveStatsQueryKey, type ScanResult } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Page, PageTitle } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ScanMap } from '@/components/zc/leaflet-map';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errMsg } from '@/lib/zc';
import { cn } from '@/lib/utils';
import { formatFeeRate, formatInr, checkedOnLabel, pricing } from '@/lib/pricing';

export default function Scan() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'pin' | 'draw'>('pin');
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [pts, setPts] = useState<[number, number][]>([]);
  const [res, setRes] = useState<ScanResult | null>(null);
  const [err, setErr] = useState('');
  const scan = useScanLand();

  const onTap = (lat: number, lon: number) => {
    if (mode === 'pin') setPin([lat, lon]);
    else setPts((p) => [...p, [lat, lon]]);
  };
  const ready = mode === 'pin' ? !!pin : pts.length >= 3;

  const run = () => {
    setErr('');
    let lat: number, lon: number;
    let boundary: Record<string, unknown> | undefined;
    if (mode === 'pin' && pin) [lat, lon] = pin;
    else if (pts.length >= 3) {
      lat = pts.reduce((a, p) => a + p[0], 0) / pts.length;
      lon = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const ring = pts.map(([a, b]) => [b, a]);
      ring.push(ring[0]);
      boundary = { type: 'Polygon', coordinates: [ring] };
    } else return;
    scan.mutate({ data: { lat, lon, ...(boundary ? { boundary_geojson: boundary } : {}) } }, {
      onSuccess: (r) => { setRes(r); qc.invalidateQueries({ queryKey: getGetLiveStatsQueryKey() }); },
      onError: (e) => setErr(errMsg(e, 'Scan is busy, try again in a minute')),
    });
  };

  return (
    <Page>
      <PageTitle eyebrow="ZeroCarbon Scan" title="Check my land" right={<DemoChip />}>
        Drop a pin on your field, or trace its edge, on satellite imagery of Karnataka. We give ranges, never promises.
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border bg-card p-1">
            {([['pin', 'Drop a pin', MapPin], ['draw', 'Draw boundary', PenLine]] as const).map(([m, label, Icon]) => (
              <button key={m} onClick={() => setMode(m)} className={cn('tap flex items-center justify-center gap-2 rounded-lg text-sm font-medium', mode === m ? 'bg-[hsl(var(--soil))] text-[hsl(var(--paper))]' : '')} data-testid={`button-mode-${m}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <ScanMap mode={mode} pin={pin} points={pts} onTap={onTap} className="h-[56dvh] min-h-[320px] w-full overflow-hidden rounded-2xl border" />
            <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-[hsl(var(--ink)/0.8)] px-3 py-1.5 text-xs text-[hsl(var(--paper))]">
              {mode === 'pin' ? (pin ? `${pin[0].toFixed(4)}, ${pin[1].toFixed(4)}` : 'Tap the map to drop a pin') : `${pts.length} corner${pts.length === 1 ? '' : 's'} · tap to add (3+)`}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {mode === 'draw' && (
              <>
                <Button variant="outline" className="tap" onClick={() => setPts((p) => p.slice(0, -1))} disabled={!pts.length} data-testid="button-undo-point" aria-label="Undo"><Undo2 className="h-4 w-4" /></Button>
                <Button variant="outline" className="tap" onClick={() => setPts([])} disabled={!pts.length} data-testid="button-clear-shape" aria-label="Clear"><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
            <Button onClick={run} disabled={!ready || scan.isPending} className="h-12 flex-1 bg-[hsl(var(--soil))] font-semibold hover:bg-[hsl(var(--soil)/0.9)]" data-testid="button-scan">
              <ScanLine className="mr-2 h-4 w-4" /> {scan.isPending ? 'Scanning...' : 'Scan this land'}
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {scan.isPending ? (
            <div className="space-y-3 rounded-2xl border bg-card p-5"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-20 w-full" /></div>
          ) : err ? (
            <div className="rounded-2xl border bg-card p-5 text-sm" data-testid="status-scan-error">{err}</div>
          ) : res ? (
            !res.available || !res.headline ? (
              <div className="rounded-2xl border border-[hsl(var(--marigold))] bg-[hsl(var(--marigold)/0.1)] p-5" data-testid="text-scan-message"><p className="font-medium">{res.message}</p></div>
            ) : (
              <article className="overflow-hidden rounded-2xl border bg-card shadow-md rise" data-testid="card-scan-result">
                <div className="bg-[hsl(var(--soil))] p-5 text-[hsl(var(--paper))]">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs uppercase tracking-widest opacity-80">Scan result</span><div className="flex items-center gap-2"><DemoChip className="bg-[hsl(var(--paper))]" /><span className="rounded-full bg-[hsl(var(--leaf)/0.2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Free. Always.</span></div></div>
                  <h2 className="mt-2 font-display text-2xl font-semibold leading-snug" data-testid="text-scan-headline">{res.headline}</h2>
                </div>
                <div className="space-y-4 p-5 text-sm">
                  {res.reasons?.length ? <ul className="space-y-1.5">{res.reasons.slice(0, 3).map((r) => <li key={r} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--leaf))]" />{r}</li>)}</ul> : null}
                  {[
                    [Sprout, 'What to plant', res.what_to_plant],
                    [ScanLine, 'Credits', res.credits_line],
                    [Coins, 'Money', res.money_line],
                    [Footprints, 'Next step', res.next_step],
                  ].filter(([, , v]) => v).map(([I, k, v]) => {
                    const Icon = I as typeof Sprout;
                    return (
                      <div key={k as string} className="flex gap-3 border-t border-dashed pt-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--soil))]" />
                        <div><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k as string}</div><p className="mt-0.5 whitespace-pre-line">{v as string}</p></div>
                      </div>
                    );
                  })}
                  {res.money_line && <p className="rounded-xl border border-[hsl(var(--leaf)/0.4)] bg-[hsl(var(--leaf)/0.08)] p-3 text-xs leading-relaxed" data-testid="text-scan-fee-disclosure">ZeroCarbon charges nothing upfront. If the credits are later sold through ZeroCarbon Market, {formatFeeRate(pricing.deal_fee.standard_rate)} of the sale goes to ZeroCarbon and the rest to the project, shared under your agreement.</p>}
                  {res.next_step?.toLowerCase().includes('first-year fee') && <p className="rounded-xl bg-secondary p-3 text-xs leading-relaxed" data-testid="text-scan-registry-fees">These are official registry fees at actual cost ({pricing.official_fees.set_by} schedule, checked {checkedOnLabel()}). Joining ZeroCarbon Pool is free, and the pool shares these fees across many farms.</p>}
                  {res.verdict !== 'not_eligible' && !/(not eligible|not likely)/i.test(res.headline) && <p className="text-xs text-muted-foreground" data-testid="text-scan-survey-option">Want help with photos? Doing it yourself is free; an assisted survey is {formatInr(pricing.packages.landowner.assisted_survey_inr)}, often paid by your FPO.</p>}
                  {res.limitations && (
                    <div className="rounded-xl bg-secondary p-3"><div className="flex items-center gap-1.5 text-xs font-semibold"><EyeOff className="h-3.5 w-3.5" /> What satellites can't see</div><p className="mt-1 whitespace-pre-line">{res.limitations}</p></div>
                  )}
                  {res.message && <p className="text-xs text-muted-foreground">{res.message}</p>}
                </div>
              </article>
            )
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              <p className="font-display text-xl text-foreground">Your land card appears here.</p>
              <p className="mt-2">Scan covers Karnataka today. Results are estimates from satellite imagery and models, shown as ranges.</p>
            </div>
          )}
        </aside>
      </div>
    </Page>
  );
}
