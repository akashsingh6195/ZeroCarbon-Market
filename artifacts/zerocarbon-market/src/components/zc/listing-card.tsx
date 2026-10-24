import { Link } from 'wouter';
import { MapPin, CalendarClock } from 'lucide-react';
import type { Listing } from '@workspace/api-client-react';
import { DemoChip } from './demo-chip';
import { LabelChip } from './label-chip';
import { ScoreRing } from './score';
import { ACTION_LABEL, MARKET_LABEL, STATUS_LABEL, actionTone, inr, marketTone, num, statusTone } from '@/lib/zc';

export function ListingLabels({ l }: { l: Listing }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <LabelChip tone={marketTone(l.market)}>{MARKET_LABEL[l.market] ?? l.market}</LabelChip>
      <LabelChip tone={actionTone(l.action)}>{ACTION_LABEL[l.action] ?? l.action}</LabelChip>
      <LabelChip tone={statusTone(l.status)}>{STATUS_LABEL[l.status] ?? l.status}</LabelChip>
      <LabelChip>Vintage {l.vintage}</LabelChip>
      <LabelChip>{l.method}</LabelChip>
      <LabelChip>{l.registry}</LabelChip>
    </div>
  );
}

export function ListingCard({
  l, compareChecked, onCompare, compareDisabled, why,
}: { l: Listing; compareChecked?: boolean; onCompare?: (v: boolean) => void; compareDisabled?: boolean; why?: string }) {
  const accent = l.action === 'removal' ? 'var(--leaf)' : l.market.startsWith('india') ? 'var(--registry)' : 'var(--forest)';
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md" data-testid={`card-listing-${l.id}`}>
      <div className="h-1.5 w-full" style={{ background: `hsl(${accent})` }} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{l.region}</span></div>
            <Link href={`/listings/${l.id}`} className="mt-1 block font-semibold leading-snug hover:underline underline-offset-4" data-testid={`link-listing-${l.id}`}>
              {l.project_name}
            </Link>
          </div>
          <ScoreRing score={l.zerocarbon_score} />
        </div>
        <ListingLabels l={l} />
        {why && <p className="rounded-lg bg-[hsl(var(--leaf)/0.1)] px-3 py-2 text-sm text-[hsl(147_50%_20%)]" data-testid={`text-why-${l.id}`}><span className="font-semibold">Why: </span>{why}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-dashed pt-3">
          <div>
            <div className="text-lg font-bold tabular-nums" data-testid={`text-price-${l.id}`}>{inr(l.price_inr_per_t)}<span className="text-xs font-medium text-muted-foreground"> / tonne</span></div>
            <div className="text-xs text-muted-foreground">{num(l.quantity_t)} t available</div>
            {l.status === 'future' && l.delivery_year && (
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[hsl(30_65%_32%)]"><CalendarClock className="h-3.5 w-3.5" /> Delivery {l.delivery_year}</div>
            )}
          </div>
          <DemoChip />
        </div>
        {onCompare && (
          <label className={`tap -mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-1 text-sm ${compareDisabled && !compareChecked ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[hsl(147_50%_24%)]"
              checked={!!compareChecked}
              disabled={compareDisabled && !compareChecked}
              onChange={(e) => onCompare(e.target.checked)}
              data-testid={`checkbox-compare-${l.id}`}
            />
            Compare
          </label>
        )}
      </div>
    </article>
  );
}
