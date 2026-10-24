import { cn } from '@/lib/utils';

const TONES: Record<string, string> = {
  forest: 'bg-[hsl(var(--forest)/0.1)] text-[hsl(var(--forest))] border-[hsl(var(--forest)/0.25)]',
  leaf: 'bg-[hsl(var(--leaf)/0.16)] text-[hsl(100_45%_26%)] border-[hsl(var(--leaf)/0.4)]',
  marigold: 'bg-[hsl(var(--marigold)/0.18)] text-[hsl(30_65%_30%)] border-[hsl(var(--marigold)/0.5)]',
  registry: 'bg-[hsl(var(--registry)/0.1)] text-[hsl(var(--registry))] border-[hsl(var(--registry)/0.3)]',
  soil: 'bg-[hsl(var(--soil)/0.1)] text-[hsl(var(--soil))] border-[hsl(var(--soil)/0.3)]',
  ink: 'bg-[hsl(var(--ink)/0.06)] text-[hsl(var(--ink)/0.8)] border-[hsl(var(--ink)/0.15)]',
};

export function LabelChip({ tone = 'ink', children, className }: { tone?: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap', TONES[tone] ?? TONES.ink, className)}>
      {children}
    </span>
  );
}
