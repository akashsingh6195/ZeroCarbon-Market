import './_group.css';
import { type ComponentPropsWithoutRef } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

type LinkProps = ComponentPropsWithoutRef<'a'> & { href: string };
function Link({ href, ...props }: LinkProps) { return <a href={href} {...props} />; }

const layers = [
  {
    title: 'Land data you can trust',
    summary: 'Know exactly which land we are looking at, and prove the picture was never changed.',
    points: [
      ['Ten years of greenness history for every plot.', 'Sentinel-2 L2A, NDVI/SWIR 10-year lookback'],
      ['Forest height measured from space, and drone surveys at 3 cm detail.', 'GEDI LiDAR · RTK drone orthomosaic (RGB + multispectral)'],
      ['Official land-parcel boundaries.', 'Karnataka Bhoomi/Dishank · ULPIN'],
      ['A tamper-proof fingerprint on every image, with its GPS point and time.', 'SHA-256(image tile + RTK GNSS + timestamp + UIN)'],
    ],
  },
  {
    title: 'Seeing every tree',
    summary: 'Find each tree in the picture and measure it, with every step open to inspection.',
    points: [
      ['Mask out houses, roads and water.', 'Claude Vision + SAM'],
      ['Find every tree crown, with its own ID, GPS point and crown size.', 'DeepForest / YOLO crown detection · Tree_UUID · crown area (m²)'],
      ['Measure tree height from a 3D drone model.', 'canopy height = surface now − bare ground at start (DSM_t1 − DEM_t0)'],
      ['Tell species and stress apart from their colour signature.', 'multispectral species and stress classifier'],
    ],
  },
  {
    title: 'Counting carbon honestly',
    summary: 'Turn trees into tonnes with published equations, and always show the error.',
    points: [
      ['Calibrate with tape measurements on 5% of trees.', 'ground DBH samples locked to height and crown area (R² > 0.88)'],
      ['Indian species equations for each tree.', 'FSI / ICFRE: biomass = a × (D² × H)^b × wood density; total = biomass × (1 + root ratio)'],
      ['Carbon change between two visits.', 'ΔCO2 = Σ(biomass now − biomass before) × 0.47 × 44/12'],
      ['An error bound and a safety buffer on every estimate.', '95% confidence bound · 5 to 15% buffer held back'],
    ],
  },
  {
    title: 'Paperwork and proof',
    summary: 'AI agents prepare the paperwork; people approve it; the registry records it.',
    points: [
      ["Project design documents drafted automatically for India's scheme and for Verra.", 'BEE CCTS BM FR05.002 · Verra VM0047 · AI agents with tools and a rulebook'],
      ['A plot passport for the EU deforestation rule.', 'EUDR GeoJSON plot geolocation'],
      ['A desk-audit view where an accredited verifier can open any tree and its raw data.', 'ACVA desk-audit console'],
      ['A link to the official registry, so every retirement is on record.', 'registry retirement records'],
    ],
  },
] as const;

export default function Vision() {
  return (
    <div className="w-full overflow-hidden bg-[hsl(var(--forest))] text-[hsl(var(--paper))]" data-testid="page-vision">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 md:pb-24 md:pt-20">
        <header className="mb-10 max-w-4xl md:mb-14" data-testid="content-vision-intro">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--marigold))]" data-testid="text-vision-label">OUR VISION</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl" data-testid="text-vision-title">
            From satellite ranges to tree-by-tree proof
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[hsl(var(--paper)/0.86)] md:text-lg" data-testid="text-vision-summary">
            Every tree seen, measured and counted, so a carbon credit can be checked down to the plant.
          </p>
        </header>

        <ol className="m-0 list-none p-0" data-testid="content-vision-layers">
          {layers.map((layer, layerIndex) => (
            <li key={layer.title} className="min-w-0" data-testid={`content-vision-layer-${layerIndex + 1}`}>
              <article className="min-w-0 overflow-hidden rounded-2xl border border-[hsl(var(--paper)/0.22)] bg-[hsl(var(--paper)/0.07)] p-5 md:rounded-3xl md:p-8">
                <div className="flex min-w-0 flex-col gap-3 border-b border-[hsl(var(--paper)/0.18)] pb-5 sm:flex-row sm:items-start sm:gap-6">
                  <span className="font-display text-5xl font-semibold leading-none text-[hsl(var(--marigold))] md:text-6xl" aria-hidden="true">
                    0{layerIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl" data-testid={`text-vision-layer-title-${layerIndex + 1}`}>
                      {layer.title}
                    </h2>
                    <p className="mt-2 break-words text-sm leading-relaxed text-[hsl(var(--paper)/0.82)] md:text-base" data-testid={`text-vision-layer-summary-${layerIndex + 1}`}>
                      {layer.summary}
                    </p>
                  </div>
                </div>
                <ul className="m-0 grid list-none gap-0 p-0 sm:grid-cols-2 sm:gap-x-8">
                  {layer.points.map(([plain, technical], pointIndex) => (
                    <li
                      key={plain}
                      className="min-w-0 border-b border-[hsl(var(--paper)/0.14)] py-4 last:border-b-0 sm:nth-last-2:border-b-0"
                      data-testid={`content-vision-point-${layerIndex + 1}-${pointIndex + 1}`}
                    >
                      <p className="break-words text-sm font-medium leading-relaxed md:text-base" data-testid={`text-vision-point-${layerIndex + 1}-${pointIndex + 1}`}>
                        {plain}
                      </p>
                      <p className="mt-2 min-w-0 break-words font-mono text-[0.68rem] leading-relaxed text-[hsl(var(--marigold))] md:text-xs" data-testid={`text-vision-technical-${layerIndex + 1}-${pointIndex + 1}`}>
                        {technical}
                      </p>
                    </li>
                  ))}
                </ul>
              </article>
              {layerIndex < layers.length - 1 && (
                <div className="flex h-14 items-center justify-center text-[hsl(var(--marigold))]" aria-hidden="true" data-testid={`content-vision-connector-${layerIndex + 1}`}>
                  <span className="h-8 border-l-2 border-dotted border-current" />
                  <ArrowDown className="-ml-[9px] mt-7 h-4 w-4 shrink-0" strokeWidth={2.5} />
                </div>
              )}
            </li>
          ))}
        </ol>

        <section className="mt-12 border-t border-[hsl(var(--paper)/0.22)] pt-8 md:mt-16 md:pt-10" data-testid="content-vision-next">
          <p className="text-base leading-relaxed text-[hsl(var(--paper)/0.9)] md:text-lg" data-testid="text-vision-closing">
            This is where ZeroCarbon is heading. Try what is live today on{' '}
            <Link href="/scan" className="font-semibold text-[hsl(var(--marigold))] underline decoration-[hsl(var(--marigold)/0.55)] underline-offset-4 hover:decoration-current" data-testid="link-vision-scan">Scan</Link>,{' '}
            <Link href="/market" className="font-semibold text-[hsl(var(--marigold))] underline decoration-[hsl(var(--marigold)/0.55)] underline-offset-4 hover:decoration-current" data-testid="link-vision-market">Market</Link> and{' '}
            <Link href="/pricing" className="font-semibold text-[hsl(var(--marigold))] underline decoration-[hsl(var(--marigold)/0.55)] underline-offset-4 hover:decoration-current" data-testid="link-vision-pricing">Pricing</Link>.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/scan" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--marigold))] px-5 font-semibold text-[hsl(var(--ink))] transition-transform hover:-translate-y-0.5" data-testid="link-vision-check-land">
              Check my land <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/market" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--paper)/0.45)] px-5 font-semibold text-[hsl(var(--paper))] transition-colors hover:bg-[hsl(var(--paper)/0.1)]" data-testid="link-vision-market-button">
              See the market <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
