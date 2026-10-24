import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check, Leaf, Sprout, Building2, Landmark } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAdminDashboardQueryKey, useRecordPlanInterest } from '@workspace/api-client-react';
import { Page, PageTitle } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session';
import { checkedOnLabel, formatFeeRate, formatInr, formatPriceRange, pricing } from '@/lib/pricing';
import { errMsg } from '@/lib/zc';
import { LandReviewBooking } from '@/components/zc/land-review-booking';

type Row = { service: string; price: string; payer: string; why: string };

function PriceTable({ title, rows, note, id }: { title: string; rows: Row[]; note?: string; id: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card" data-testid={`section-prices-${id}`}>
      <h2 className="border-b bg-[hsl(var(--forest)/0.06)] px-4 py-4 font-display text-xl font-semibold">{title}</h2>
      <div className="p-3 md:p-0">
        <div className="hidden grid-cols-[1.05fr_.8fr_.8fr_1.4fr] gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Service</span><span>Price</span><span>Who pays</span><span>Why</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.service} className="mb-2 grid min-w-0 gap-2 rounded-xl border bg-background p-3 text-sm md:mb-0 md:grid-cols-[1.05fr_.8fr_.8fr_1.4fr] md:gap-3 md:rounded-none md:border-0 md:border-t md:px-4 md:py-3" data-testid={`row-${id}-${i}`}>
            <div className="font-semibold">{r.service}</div>
            <div><span className="mr-2 text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Price</span>{r.price}</div>
            <div><span className="mr-2 text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Who pays</span>{r.payer}</div>
            <div className="text-muted-foreground"><span className="mr-2 text-[10px] uppercase tracking-wider md:hidden">Why</span>{r.why}</div>
          </div>
        ))}
      </div>
      {note && <p className="border-t bg-secondary/60 px-4 py-3 text-sm" data-testid={`text-note-${id}`}>{note}</p>}
    </section>
  );
}

export default function Pricing() {
  const qc = useQueryClient();
  const { org, roles } = useSession();
  const interest = useRecordPlanInterest();
  const [thanks, setThanks] = useState('');
  const p = pricing;
  const record = (plan: 'pool_starter' | 'pool_essential' | 'pool_growth' | 'company_or_trader') => {
    interest.mutate({ data: { plan } }, {
      onSuccess: () => {
        setThanks('Thanks, we will get in touch. Demo: nothing is charged.');
        qc.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
      },
    });
  };
  const status = String(p.status);
  const land = p.packages.landowner;
  const plans = [
    { name: 'Farmer or landowner', icon: Sprout, price: formatInr(land.price_inr), detail: `Scan, the credit range, route comparison, joining the Pool, the Path tracker, and every deduction shown before you sign.`, extra: `Optional assisted survey ${formatInr(land.assisted_survey_inr)}, usually paid by your FPO or project developer.`, href: '/scan', cta: 'Check my land', highlight: false },
    { name: 'FPO or project starter', icon: Leaf, price: `${formatInr(p.packages.pool_essential.annual_inr)} a year`, detail: `Pool Essential · up to ${p.packages.pool_essential.max_plots.toLocaleString('en-IN')} plots, bulk plot upload, document checklist, status tracking, standard exports and some support hours.`, extra: `Starts with a free ${p.packages.pool_starter.pilot_days}-day pilot. Surveys and fieldwork are quoted separately: operator cost plus a disclosed coordination charge.`, plan: 'pool_starter' as const, cta: 'Start the free 90-day pilot', highlight: true },
    { name: 'Project developer', icon: Landmark, price: `${formatInr(p.packages.pool_growth.annual_inr)} a year`, detail: `Pool Growth · up to ${p.packages.pool_growth.max_plots.toLocaleString('en-IN')} plots, field-team roles, monitoring log, bulk uploads and reports.`, extra: `Project coordination ${formatPriceRange(p.services.project_coordination_min_inr, p.services.project_coordination_max_inr)} per agreed work package.`, plan: 'pool_growth' as const, cta: 'Talk to us', highlight: false },
    { name: 'Company or trader', icon: Building2, price: `${formatPriceRange(p.packages.company_or_trader.annual_min_inr, p.packages.company_or_trader.annual_max_inr)} a year`, detail: `ZeroCarbon Desk for traders (voluntary credits only), ZeroCarbon Comply Pro or Enterprise for plants with a CCTS target, and buyer reports.`, extra: 'Our deal fee applies only to completed deals.', plan: 'company_or_trader' as const, cta: 'Talk to us', highlight: false },
  ];

  const landRows: Row[] = [
    ['ZeroCarbon Scan (satellite check)', 'Free', 'Nobody', 'A first check, not a verified credit.'],
    ['Credit and money range', 'Free', 'Nobody', 'Builds trust; easy to share with family or the FPO.'],
    ['Phone-photo survey', `Free if self-captured; ${formatInr(land.assisted_survey_inr)} assisted`, 'Landowner or sponsoring FPO', 'Charged only for guided capture, a reviewed result and a report.'],
    ['Drone or field survey', formatPriceRange(p.services.drone_field_survey_min_inr, p.services.drone_field_survey_max_inr) + ' per plot', 'Preferably FPO or project sponsor', "Operator cost plus a disclosed coordination charge, only when arranged."],
    ['Document checklist and route comparison', 'Free', 'Nobody', 'Never sold as government approval.'],
    ['Document organising', `Free if self-organised; ${formatPriceRange(p.services.document_organising_min_inr, p.services.document_organising_max_inr)} assisted`, 'Preferably sponsor, FPO or developer', 'Filing, a missing-document list and data entry, not legal certification.'],
    ['Join ZeroCarbon Pool', 'Free', 'Nobody', 'The pool needs enough plots to form a project.'],
    ['ZeroCarbon Path tracker', 'Free for landowners', 'FPOs and developers pay for team tools', 'Landowners see progress and payment sums without a subscription.'],
    ['Monitoring photos', 'Free; field visits quoted upfront', 'Developer or FPO, unless landowner opts in', 'No small repeating charges.'],
    ['Selling credits', 'No fee before credits are issued or sold', 'Nobody upfront', 'Farmers never pay for an uncertain result.'],
  ].map(([service, price, payer, why]) => ({ service, price, payer, why }));
  const orgRows: Row[] = [
    ['Pool Starter', `Free for ${p.packages.pool_starter.pilot_days} days`, 'Nobody', 'Project workspace, plot intake, limited Scan results.'],
    ['Pool Essential', `${formatInr(p.packages.pool_essential.monthly_inr)} monthly or ${formatInr(p.packages.pool_essential.annual_inr)} yearly`, 'FPO or developer', `Up to ${p.packages.pool_essential.max_plots.toLocaleString('en-IN')} plots, document checklist, status tracking, standard exports.`],
    ['Pool Growth', `${formatInr(p.packages.pool_growth.monthly_inr)} monthly or ${formatInr(p.packages.pool_growth.annual_inr)} yearly`, 'FPO or developer', `Up to ${p.packages.pool_growth.max_plots.toLocaleString('en-IN')} plots, field-team roles, monitoring log, bulk uploads, reports.`],
    ['Pool Enterprise', `${formatPriceRange(p.packages.pool_enterprise.annual_min_inr, p.packages.pool_enterprise.annual_max_inr)} yearly`, 'FPO or developer', 'Large portfolios, several programmes, custom reports, onboarding and service terms.'],
    ['Feasibility pack', formatPriceRange(p.services.feasibility_pack_min_inr, p.services.feasibility_pack_max_inr), 'Project owner', 'Project screening, method questions, data gaps, rough costs and earnings.'],
    ['Project coordination', `${formatPriceRange(p.services.project_coordination_min_inr, p.services.project_coordination_max_inr)} per work package`, 'Project owner', 'Agreed deliverables, such as gathering plot records or a monitoring data room.'],
    ['Custom integrations', `${formatPriceRange(p.services.custom_integration_min_inr, p.services.custom_integration_max_inr)} setup, quoted each time`, 'Project owner', 'Only for real integrations or bespoke work.'],
  ].map(([service, price, payer, why]) => ({ service, price, payer, why }));
  const tradeRows: Row[] = [
    ['Browse and compare listings', 'Free', 'Nobody', 'See the market before choosing.'],
    ['Basic seller listing', 'Free', 'Nobody', 'A simple listing with clear project details.'],
    ['Completed voluntary deal', `${formatFeeRate(p.deal_fee.standard_rate)} of the deal`, 'Seller', 'Paid only when credits are delivered.'],
    ['Large or repeat deals', `${formatFeeRate(p.deal_fee.large_repeat_min_rate)} to ${formatFeeRate(p.deal_fee.large_repeat_max_rate)}`, 'Seller, agreed before deal', 'A lower rate can be agreed in advance.'],
    ['Due-diligence report', `${formatPriceRange(p.services.due_diligence_min_inr, p.services.due_diligence_max_inr)} per project`, 'Buyer who asks', 'Method, vintage, registry status, documents and stated limits.'],
    ['Sourcing help', formatPriceRange(p.services.sourcing_help_min_inr, p.services.sourcing_help_max_inr), 'Buyer who asks', 'Find and compare suppliers.'],
    ['Custom portfolio or impact report', formatPriceRange(p.services.portfolio_report_min_inr, p.services.portfolio_report_max_inr), 'Buyer who asks', 'A separate, agreed service.'],
  ].map(([service, price, payer, why]) => ({ service, price, payer, why }));
  const companyRows: Row[] = [
    ['Comply Lite', 'Free', 'Nobody', 'Readiness checklist and links to the official process.'],
    ['Comply Pro', `${formatInr(p.packages.comply_pro.annual_inr)} a year`, 'Company', 'Compliance calendar, document checklist, scenario worksheets and reminders.'],
    ['Comply Enterprise', `${formatPriceRange(p.packages.comply_enterprise.annual_min_inr, p.packages.comply_enterprise.annual_max_inr)} a year`, 'Company', 'Many plants, user roles, management reports and support.'],
    ['ZeroCarbon Desk for traders', `${formatInr(p.packages.desk_trader.annual_inr)} a year`, 'Trader', 'Voluntary-credit pipeline, lot tracking, deal notes and portfolio reports. Voluntary credits only.'],
    ['ZeroCarbon Ledger Pro', `${formatPriceRange(p.services.ledger_pro_min_annual_inr, p.services.ledger_pro_max_annual_inr)} a year`, 'Company or trader', 'Deal records, documents, holdings and exports.'],
    ['Data or API access', `${formatPriceRange(p.services.data_api_setup_min_inr, p.services.data_api_setup_max_inr)} setup plus yearly support`, 'Company', 'Quoted to match the requested access.'],
  ].map(([service, price, payer, why]) => ({ service, price, payer, why }));
  const of = p.official_fees;
  return (
    <Page className="space-y-10">
      <PageTitle eyebrow="Clear prices, before any work" title="Free to check. Pay only for work that saves you time, or when a deal completes." />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[hsl(var(--marigold))] bg-card p-4" data-testid="status-pricing-demo">
        <DemoChip /><span className="rounded-full bg-[hsl(var(--leaf)/0.14)] px-3 py-1 text-xs font-bold text-[hsl(var(--forest))]">Proposed launch prices</span>
        <span className="text-sm font-medium">Proposed prices. Demo: no payment is taken.</span>
      </div>
      {thanks && <p role="status" className="rounded-xl border border-[hsl(var(--leaf)/0.5)] bg-[hsl(var(--leaf)/0.12)] p-4 text-sm font-semibold" data-testid="status-interest-thanks"><Check className="mr-2 inline h-4 w-4" />{thanks}</p>}
      {interest.isError && <p role="alert" className="text-sm text-destructive">{errMsg(interest.error, 'Could not save your interest. Please try again.')}</p>}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Plans">
        {plans.map((x, i) => <article key={x.name} className={`flex min-w-0 flex-col rounded-2xl border bg-card p-5 transition-transform duration-200 hover:-translate-y-1 ${x.highlight ? 'border-[hsl(var(--forest))] shadow-md' : ''}`} data-testid={`card-plan-${i}`}>
          <x.icon className="h-6 w-6 text-[hsl(var(--forest))]" />
          <h2 className="mt-4 font-display text-xl font-semibold">{x.name}</h2>
          <p className="mt-2 text-lg font-bold tabular-nums">{x.price}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{x.detail}</p>
          <p className="mt-3 text-sm leading-relaxed">{x.extra}</p>
          {x.href === '/scan' && <div className="mt-4"><LandReviewBooking context="pricing" /></div>}
          <div className="mt-auto pt-5">{x.href ? <Link href={x.href} className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-secondary" data-testid="link-plan-scan">{x.cta}<ArrowRight className="h-4 w-4" /></Link> : <Button className="h-11 w-full text-sm" disabled={interest.isPending} onClick={() => record(x.plan!)} data-testid={`button-interest-${i}`}>{x.cta}</Button>}</div>
        </article>)}
      </section>
      <p className="text-xs text-muted-foreground">All amounts are proposed launch prices. No payment is taken for any plan or service.{org && roles.length > 0 ? ` Showing options for ${roles.join(', ')}.` : ''}</p>
      <div className="space-y-5">
        <PriceTable id="landowners" title="A. Landowners" rows={landRows} />
        <PriceTable id="projects" title="B. FPOs and project developers" rows={orgRows} note="Never hidden inside a plan: registry fees, independent validation and verification, soil sampling, lab tests, drone operator fees and major fieldwork. These are paid directly or quoted separately." />
        <PriceTable id="trades" title="C. Voluntary buyers and sellers" rows={tradeRows} note="One side pays the deal fee: the seller. A buyer pays only for a separate service they ask for, agreed in writing." />
        <PriceTable id="companies" title="D. Companies, plants and traders" rows={companyRows} note="These are software and workflow prices, not payment for a certificate, a registry account or an audit." />
      </div>
      <section className="overflow-hidden rounded-2xl border bg-card" data-testid="section-official-fees">
        <h2 className="border-b bg-[hsl(var(--registry)/0.07)] px-4 py-4 font-display text-xl font-semibold">Official fees, paid at actual cost</h2>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {[
            ['Account opening', formatInr(of.account_opening_inr)],
            ['Yearly account fee', formatInr(of.yearly_account_inr)],
            ['Project registration', (of.project_registration_inr as number[]).map(formatInr).join(', ') + ' depending on project size'],
            ['Issuance', `${formatInr(of.issuance_per_credit_inr)} per credit`],
          ].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 rounded-lg bg-background p-3 text-sm"><span>{label}</span><strong>{value}</strong></div>)}
        </div>
        <p className="border-t p-4 text-sm text-muted-foreground">Set by {of.set_by} under the offset fee schedule, paid to the registry, not to ZeroCarbon. Checked {checkedOnLabel()}; check the current official schedule before paying. Independent validation and verification are quoted directly by the accredited agency.</p>
      </section>
      <section className="rounded-3xl bg-[hsl(var(--soil))] p-5 text-[hsl(var(--paper))] md:p-7" data-testid="section-never-charge">
        <h2 className="font-display text-2xl font-semibold">What we never charge for</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            'An eligibility result. The free Scan always gives a useful answer, even “not likely”.',
            'A markup on official fees. We show the fee, who sets it and when we checked it.',
            "A favourable audit. The auditor's bill stays separate from ours.",
            'Promised credits or payouts. Nothing is paid upfront for them, and we cannot promise approval or issuance.',
            "Hidden deductions. Before signing you see the farmer's share, project costs, the buffer, our fee, when payouts happen and how to leave.",
            'Surprise charges on a deal. The price, our fee and any other charges show before anyone commits.',
            'Prices we have not tested. We review them after our first 20 to 30 paying customers.',
          ].map((copy, i) => <li key={copy} className="flex gap-3 rounded-xl border border-[hsl(var(--paper)/0.18)] bg-[hsl(var(--paper)/0.06)] p-3 text-sm"><span className="font-mono text-[hsl(var(--marigold))]">0{i + 1}</span><span>{copy}</span></li>)}
        </ol>
        <p className="mt-5 flex items-start gap-2 text-sm text-[hsl(var(--paper)/0.8)]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--marigold))]" />We cannot promise approval or issuance.</p>
      </section>
      <p className="text-sm text-muted-foreground" data-testid="text-pricing-check-date">Prices checked {checkedOnLabel()} · {status}</p>
    </Page>
  );
}
