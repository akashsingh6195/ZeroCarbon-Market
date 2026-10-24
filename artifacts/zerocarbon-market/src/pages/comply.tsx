import { Link } from 'wouter';
import { Landmark } from 'lucide-react';
import { Page } from '@/components/zc/layout';

export default function Comply() {
  return (
    <Page className="max-w-2xl">
      <div className="relative overflow-hidden rounded-3xl bg-[hsl(var(--registry))] p-8 text-[hsl(var(--paper))] rise md:p-12">
        <Landmark className="h-8 w-8 text-[hsl(var(--marigold))]" />
        <div className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] opacity-80">For plants with a CCTS target</div>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight" data-testid="text-comply-title">ZeroCarbon Comply, coming soon</h1>
        <p className="mt-4 max-w-md text-[hsl(var(--paper)/0.85)]">Compliance buying under India's Carbon Credit Trading Scheme needs its own checks. We are building that separately, so this demo does not take compliance orders.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/market" className="inline-flex h-12 items-center justify-center rounded-xl bg-[hsl(var(--paper))] px-5 font-semibold text-[hsl(var(--registry))]" data-testid="link-comply-market">Browse compliance listings</Link>
          <Link href="/ask" className="inline-flex h-12 items-center justify-center rounded-xl border border-[hsl(var(--paper)/0.5)] px-5 font-semibold" data-testid="link-comply-ask">Ask a question</Link>
        </div>
      </div>
    </Page>
  );
}
