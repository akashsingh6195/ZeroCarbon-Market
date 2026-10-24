import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The single shared "Demo data" chip. Used on every screen with prices, credits or certificates. */
export function DemoChip({ size = 'sm', className }: { size?: 'sm' | 'lg'; className?: string }) {
  return (
    <span
      data-testid="chip-demo-data"
      title="Fictional demo data. No money moves and no real credits change hands."
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-dashed border-[hsl(var(--marigold))] bg-[hsl(var(--marigold)/0.14)] font-semibold uppercase tracking-wider text-[hsl(30_60%_28%)] whitespace-nowrap',
        size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-0.5 text-[10px]',
        className,
      )}
    >
      <FlaskConical className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} aria-hidden />
      Demo data
    </span>
  );
}
