import { Link } from 'wouter';
import { Landmark, Check } from 'lucide-react';
import { Page } from '@/components/zc/layout';
import { useRecordPlanInterest, getGetAdminDashboardQueryKey, useForecastSampleCompliance, type SampleComplianceForecast } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatInr, formatPriceRange, pricing } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { errMsg } from '@/lib/zc';
import { DemoChip } from '@/components/zc/demo-chip';

export default function Comply() {
  const qc = useQueryClient();
  const interest = useRecordPlanInterest();
  const sampleForecast = useForecastSampleCompliance();
  const [thanks, setThanks] = useState(false);
  const [sampleResult, setSampleResult] = useState<SampleComplianceForecast | null>(null);
  const formatIntensity = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(value);
  const formatTonnes = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
  const runSampleForecast = () => {
    setSampleResult(null);
    sampleForecast.mutate(undefined, {
      onSuccess: setSampleResult,
      onError: () => setSampleResult({ available: false, message: 'The sample could not be worked out right now.' }),
    });
  };
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
        <section className="mt-8 rounded-2xl border border-[hsl(var(--paper)/0.25)] bg-[hsl(var(--paper)/0.08)] p-5" data-testid="section-sample-factory">
          <h2 className="font-display text-2xl font-semibold">Preview a sample forecast</h2>
          <p className="mt-2 text-sm text-[hsl(var(--paper)/0.85)]">Try a fixed, fictional factory sample. This does not submit real plant data.</p>
          <Button className="mt-4 h-11" disabled={sampleForecast.isPending} onClick={runSampleForecast} data-testid="button-sample-factory">
            {sampleForecast.isPending ? 'Working…' : 'Try it with a sample factory'}
          </Button>
          {sampleResult && (
            <div className="mt-4 rounded-xl bg-[hsl(var(--paper))] p-4 text-[hsl(var(--ink))]" aria-live="polite" data-testid="result-sample-factory">
              <div className="mb-3"><DemoChip /></div>
              {sampleResult.available && sampleResult.intensity_now !== undefined && sampleResult.target !== undefined &&
              sampleResult.forecast_year_end && sampleResult.shortfall_t ? (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Sample factory (fictional), six months of data.</p>
                  <p>Emissions now: {formatIntensity(sampleResult.intensity_now)} tonnes of CO2 per tonne of product. Target: {formatIntensity(sampleResult.target)}.</p>
                  <p>By year end: {formatIntensity(sampleResult.forecast_year_end.low)} to {formatIntensity(sampleResult.forecast_year_end.high)}, most likely {formatIntensity(sampleResult.forecast_year_end.likely)}.</p>
                  {sampleResult.shortfall_t.likely > 0 ? (
                    <p>Likely shortfall: about {formatTonnes(sampleResult.shortfall_t.likely)} tonnes ({formatTonnes(sampleResult.shortfall_t.low)} to {formatTonnes(sampleResult.shortfall_t.high)}). The plant would need that many compliance credits, bought through India's power exchanges.</p>
                  ) : (
                    <p>On track: about {formatTonnes(Math.abs(sampleResult.shortfall_t.likely))} tonnes better than the target.</p>
                  )}
                  <p className="text-xs text-muted-foreground">Counts fuel and electricity only. ZeroCarbon does not run an exchange or place bids.</p>
                </div>
              ) : (
                <p className="text-sm" data-testid="text-sample-factory-unavailable">
                  {sampleResult.message || 'The sample could not be worked out right now.'}
                </p>
              )}
            </div>
          )}
        </section>
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
