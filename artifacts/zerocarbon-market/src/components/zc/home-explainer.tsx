import { useEffect } from 'react';
import { Link } from 'wouter';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  BadgeCheck,
  Building2,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  Leaf,
  Map,
  MapPinned,
  Satellite,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react';

const journey = [
  {
    title: 'Land and project.',
    copy: 'A farmer plants trees, or a project cuts emissions.',
    help: 'ZeroCarbon: free satellite Scan, Rs 299 land review, and ZeroCarbon Pool so small farms share the fees.',
    Icon: Sprout,
  },
  {
    title: 'Project design.',
    copy: 'The project writes how it will cut or remove CO2.',
    help: 'ZeroCarbon: AI agents draft the design document and ask only what satellites cannot see.',
    Icon: FileText,
  },
  {
    title: 'Validation and registration.',
    copy: 'An accredited checker reviews it; the government registers it (BEE, registry by GRID-INDIA).',
    help: 'ZeroCarbon: Path tracker for all 7 government steps and every fee, shown upfront.',
    Icon: BadgeCheck,
  },
  {
    title: 'Monitoring and verification.',
    copy: 'Tonnes are measured and checked again.',
    help: 'ZeroCarbon: satellites watch tree cover; the ZeroCarbon Score flags problems.',
    Icon: Satellite,
  },
  {
    title: 'Issuance.',
    copy: 'Credits are issued with serial numbers.',
    help: 'ZeroCarbon: every listing is reviewed before it goes live.',
    Icon: ClipboardCheck,
  },
  {
    title: 'Trading.',
    copy: 'Plants with targets buy compliance credits on power exchanges each month; companies buy voluntary credits.',
    help: 'ZeroCarbon Market: every label in plain sight; traders get voluntary credits only.',
    Icon: ArrowDownUp,
  },
  {
    title: 'Retirement and claims.',
    copy: 'The buyer retires credits and says what they did.',
    help: 'ZeroCarbon: Claim Checker keeps the claim honest; certificate in one click.',
    Icon: ShieldCheck,
  },
];

const routes = [
  ['Market', '/market'],
  ['Scan', '/scan'],
  ['Orders', '/orders'],
  ['Ask', '/ask'],
  ['Pricing', '/pricing'],
  ['Live', '/live'],
];

function RevealObserver() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return null;
}

export function HomeExplainer() {
  return (
    <>
      <RevealObserver />
      <section className="home-explainer w-full bg-[hsl(var(--forest))] px-4 py-14 text-[hsl(var(--paper))] md:py-20" aria-labelledby="credit-path-title" data-testid="section-credit-path">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--marigold))]">From land to a clear claim</p>
            <h2 id="credit-path-title" className="font-display text-3xl font-semibold leading-tight md:text-4xl">How a carbon credit is made, and where we help</h2>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--paper)/0.84)] md:text-base">One credit is one tonne of CO2 kept out of the air or pulled back out. Here is the path every credit takes in India, and what ZeroCarbon does at each step.</p>
          </header>

          <ol className="journey-flow" data-testid="content-credit-journey">
            {journey.map(({ title, copy, help, Icon }, index) => (
              <li key={title} className="journey-step zc-reveal" data-reveal data-testid={`content-journey-step-${index + 1}`}>
                <div className="journey-icon"><Icon aria-hidden="true" className="h-5 w-5" /></div>
                <div className="mt-3 font-semibold leading-snug">{title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--paper)/0.82)]">{copy}</p>
                <p className="mt-3 rounded-lg bg-[hsl(var(--marigold))] px-3 py-2 text-xs font-semibold leading-relaxed text-[hsl(var(--ink))]">{help}</p>
                {index < journey.length - 1 && (
                  <span className={`journey-connector ${index === 3 ? 'journey-turn' : ''}`} aria-hidden="true">
                    {index === 3 ? <ArrowDown /> : <ArrowRight />}
                  </span>
                )}
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="content-credit-facts">
            {[
              'About 490 plants with targets',
              '7 sectors',
              '7 government steps',
              'About Rs 57,000 in first-year fees for one small project',
            ].map((fact, index) => (
              <div key={fact} className="min-w-0 rounded-xl border border-[hsl(var(--paper)/0.3)] bg-[hsl(var(--paper)/0.08)] p-3 text-sm font-semibold leading-snug text-[hsl(var(--paper))]" data-testid={`text-credit-fact-${index + 1}`}>{fact}</div>
            ))}
          </div>
          <p className="border-l-2 border-[hsl(var(--marigold))] pl-4 text-sm font-medium leading-relaxed text-[hsl(var(--paper))]">That is why small farms need to pool together, and why buyers need to see the labels.</p>
        </div>
      </section>

      <section className="system-section w-full overflow-hidden bg-[hsl(var(--forest))] px-4 pb-14 text-[hsl(var(--paper))] md:pb-20" aria-labelledby="system-title" data-testid="section-system">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[hsl(var(--paper)/0.16)] bg-[hsl(var(--forest))] p-5 md:p-8">
        <div className="mb-7 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--marigold))]">Tools, people, and evidence</p>
          <h2 id="system-title" className="font-display text-3xl font-semibold md:text-4xl">The system behind ZeroCarbon</h2>
        </div>

        <div className="system-stack" data-testid="content-system-layers">
          <div className="system-layer people-layer" data-testid="content-system-people">
            <div className="people-grid">
              {[
                { label: 'Buyers', Icon: Users },
                { label: 'Farmers and sellers', Icon: Sprout },
                { label: 'Traders (voluntary only)', Icon: Building2 },
              ].map(({ label, Icon }) => <div key={label} className="person-label"><Icon className="h-5 w-5 text-[hsl(var(--marigold))]" aria-hidden="true" /><span>{label}</span></div>)}
            </div>
          </div>
          <div className="system-arrow" aria-hidden="true"><span /><ArrowDown /></div>
          <div className="system-layer market-layer" data-testid="content-system-market">
            <div className="flex items-center gap-2">
              <ChartNoAxesCombined className="h-5 w-5 shrink-0 text-[hsl(var(--marigold))]" aria-hidden="true" />
              <h3 className="font-semibold">ZeroCarbon Market</h3>
            </div>
            <nav className="mt-3 flex flex-wrap gap-2" aria-label="ZeroCarbon sections">
              {routes.map(([label, href]) => <Link key={href} href={href} className="system-link" data-testid={`link-system-${label.toLowerCase()}`}>{label}<ArrowRight className="h-3.5 w-3.5" /></Link>)}
            </nav>
          </div>
          <div className="system-arrow" aria-hidden="true"><span /><ArrowDown /></div>
          <div className="system-layer agent-layer" data-testid="content-system-agents">
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--marigold))]" aria-hidden="true" />
              <h3 className="font-semibold">18 AI agents on Pine Labs AgenticOrg</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Need Interpreter', 'Listing Matcher', 'Claim Checker', 'Certificate Writer', 'Order Concierge', 'Land Scout', 'Ask ZeroCarbon', 'Compliance Guard', '+10 for sellers and plants'].map((name) => <span key={name} className="agent-chip">{name}</span>)}
            </div>
            <p className="mt-3 text-sm font-medium text-[hsl(var(--forest))]">Every answer checked; a person on risky steps.</p>
          </div>
          <div className="system-arrow" aria-hidden="true"><span /><ArrowDown /></div>
          <div className="system-layer models-layer" data-testid="content-system-models">
            <div className="flex items-start gap-2">
              <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--forest))]" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-[hsl(var(--forest))]">ZeroCarbon models</h3>
                <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--ink))]">9 tools: land scan, score, compliance forecast, listing search, prices, claim rules, banned words, knowledge search, route costs.</p>
                <p className="mt-2 text-sm font-semibold text-[hsl(var(--forest))]">Ranges, never a made-up number.</p>
              </div>
            </div>
          </div>
          <div className="system-arrow" aria-hidden="true"><span /><ArrowDown /></div>
          <div className="system-layer science-layer" data-testid="content-system-science">
            <div className="flex items-start gap-2">
              <Map className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--marigold))]" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">Satellites and science</h3>
                <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--paper)/0.84)]">Free global land-cover and water maps; published tree-growth research; official fee schedules.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/scan" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--marigold))] px-5 font-semibold text-[hsl(var(--ink))] transition-transform hover:-translate-y-0.5" data-testid="link-system-check-land">Check my land<ArrowRight className="h-4 w-4" /></Link>
          <Link href="/market" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--paper)/0.45)] px-5 font-semibold text-[hsl(var(--paper))] transition-colors hover:bg-[hsl(var(--paper)/0.1)]" data-testid="link-system-buy-credits">Buy credits<ArrowRight className="h-4 w-4" /></Link>
        </div>
        </div>
      </section>
    </>
  );
}
