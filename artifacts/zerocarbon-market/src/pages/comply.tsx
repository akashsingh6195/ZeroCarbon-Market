import { Link } from 'wouter';
import { Landmark, Check } from 'lucide-react';
import { Page } from '@/components/zc/layout';
import { useRecordPlanInterest, getGetAdminDashboardQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatInr, formatPriceRange, pricing } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { errMsg } from '@/lib/zc';

export default function Comply() {
  const qc = useQueryClient();
  const interest = useRecordPlanInterest();
  const [thanks, setThanks] = useState(false);
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
        <div className="mt-8 rounded-2xl border border-[hsl(var(--paper)/0.25)] bg-[hsl(var(--paper)/0.08)] p-5">
          <h2 className="font-display text-2xl font-semibold">A clear starting point</h2>
          <p className="mt-3 text-sm leading-relaxed">Comply Lite: a free readiness checklist and links to the official process. Comply Pro: {formatInr(pricing.packages.comply_pro.annual_inr)} a year for the compliance calendar, document checklist, scenario worksheets and reminders. Comply Enterprise: {formatPriceRange(pricing.packages.comply_enterprise.annual_min_inr, pricing.packages.comply_enterprise.annual_max_inr)} a year for many plants.</p>
          <p className="mt-3 text-sm leading-relaxed">ZeroCarbon never charges for placing a compliance bid and does not run an exchange. Plants trade only through the official power exchanges.</p>
          {thanks ? <p role="status" className="mt-4 font-semibold" data-testid="status-comply-interest"><Check className="mr-2 inline h-4 w-4" />Thanks, we will get in touch. Demo: nothing is charged.</p> : <Button className="mt-4 h-11" disabled={interest.isPending} onClick={() => interest.mutate({ data: { plan: 'comply_pro' } }, { onSuccess: () => { setThanks(true); qc.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }); } })} data-testid="button-comply-interest">Tell me when it's ready</Button>}
           {interest.isError && <p role="alert" className="mt-2 text-sm">{errMsg(interest.error, 'Could not save your interest. Please try again.')}</p>}
        </div>
      </div>
    </Page>
  );
}
