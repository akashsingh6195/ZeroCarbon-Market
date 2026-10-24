import './_group.css';
import { useEffect, useRef, useState } from 'react';

type Tile = { label: string; detail: string; icon: string };
type Layer = { title: string; metric: string; caption: string; kind: number; tiles: Tile[] };

const layers: Layer[] = [
  {
    title: 'Land data you can trust',
    metric: '3 cm',
    caption: 'drone detail',
    kind: 0,
    tiles: [
      { label: '10 years of history', detail: 'Sentinel-2 NDVI/SWIR', icon: 'history' },
      { label: 'Height from space', detail: 'GEDI LiDAR', icon: 'height' },
      { label: 'Official plot boundaries', detail: 'Bhoomi · ULPIN', icon: 'boundary' },
      { label: 'Tamper-proof images', detail: 'SHA-256 + RTK GPS + time', icon: 'lock' },
    ],
  },
  {
    title: 'Seeing every tree',
    metric: '1 tree = 1 ID',
    caption: '',
    kind: 1,
    tiles: [
      { label: 'Mask houses and roads', detail: 'Claude Vision + SAM', icon: 'mask' },
      { label: 'Find every crown', detail: 'DeepForest / YOLO', icon: 'crown' },
      { label: 'Measure height', detail: 'DSM − DEM', icon: 'height' },
      { label: 'Know the species', detail: 'multispectral classifier', icon: 'leaf' },
    ],
  },
  {
    title: 'Counting carbon honestly',
    metric: '95%',
    caption: 'error bound shown',
    kind: 2,
    tiles: [
      { label: 'Tape-check 5% of trees', detail: 'ground DBH calibration', icon: 'tape' },
      { label: 'Indian tree equations', detail: 'FSI / ICFRE allometry', icon: 'equation' },
      { label: 'Growth between visits', detail: 'ΔCO2 × 0.47 × 44/12', icon: 'growth' },
      { label: 'Safety buffer held back', detail: '5–15% buffer', icon: 'buffer' },
    ],
  },
  {
    title: 'Paperwork and proof',
    metric: '18',
    caption: 'AI agents',
    kind: 3,
    tiles: [
      { label: 'Design documents drafted', detail: 'BM FR05.002 · VM0047', icon: 'document' },
      { label: 'EU plot passport', detail: 'EUDR GeoJSON', icon: 'passport' },
      { label: 'Verifier desk-audit', detail: 'ACVA console', icon: 'verify' },
      { label: 'Registry record', detail: 'retirement records', icon: 'registry' },
    ],
  },
];

function Crown({ x, y, r = 13, lit = false, delay = 0 }: { x: number; y: number; r?: number; lit?: boolean; delay?: number }) {
  return <g className={lit ? 'v-crown lit' : 'v-crown'} style={{ animationDelay: `${delay}s` }}><circle cx={x} cy={y} r={r} /><circle cx={x - 6} cy={y + 2} r={r * .68} /><circle cx={x + 6} cy={y + 1} r={r * .68} /></g>;
}

function Illustration({ kind }: { kind: number }) {
  if (kind === 0) return (
    <svg className="v-illustration" viewBox="0 0 660 310" role="img" aria-label="Satellite and drone mapping a farm plot">
      <defs><pattern id="fieldGrid" width="32" height="22" patternUnits="userSpaceOnUse"><path d="M0 0H32M0 0V22" fill="none" stroke="#a6c38b" strokeWidth="1" opacity=".45" /></pattern></defs>
      <path d="M28 196 170 108l216 7 219 77-148 75-226-5z" fill="#345d3e" stroke="#d7d9a9" strokeWidth="2" />
      <path d="M28 196 170 108l216 7 219 77-148 75-226-5z" fill="url(#fieldGrid)" />
      <path d="M66 194 204 129m16 129 142-117m36 125 144-89" stroke="#e1bd6c" strokeWidth="2" strokeDasharray="5 7" opacity=".7" />
      <path d="M99 179c58-29 137-31 193 0s106 31 167 1" fill="none" stroke="#f3eee0" strokeWidth="1.5" strokeDasharray="4 6" opacity=".58" />
      {[ [118,184],[167,157],[221,196],[270,162],[315,210],[369,174],[418,213],[468,186],[516,208] ].map(([x,y],i)=><Crown key={i} x={x} y={y} r={10} lit={i<7} />)}
      <g className="v-satellite" transform="translate(92 34)"><path d="M20 21 42 43m-25-7-12 12m44-31 12-12" stroke="#f2bd53" strokeWidth="2" /><rect x="22" y="18" width="20" height="20" rx="4" fill="#f2bd53" transform="rotate(45 32 28)" /><path d="M0 7h17v19H0zm50 22h17v19H50z" fill="#7594a0" stroke="#e7e3d4" /><path d="M15 45q19 14 38 0" fill="none" stroke="#f2bd53" strokeDasharray="3 4" /></g>
      <g className="v-drone" transform="translate(464 74)"><path d="M8 20h40M28 8v24M12 15 5 9m36 6 7-6" stroke="#f6f0dd" strokeWidth="2" /><rect x="20" y="13" width="16" height="13" rx="4" fill="#f2bd53" /><circle cx="5" cy="8" r="4" fill="none" stroke="#f6f0dd" /><circle cx="49" cy="8" r="4" fill="none" stroke="#f6f0dd" /><path d="M28 27v25" stroke="#f2bd53" strokeDasharray="3 4" /></g>
      <path d="M334 116 440 64" stroke="#f2bd53" strokeDasharray="4 5" opacity=".6" />
      <circle cx="329" cy="217" r="42" fill="none" stroke="#f2bd53" strokeWidth="1.5" strokeDasharray="3 5" className="v-scanring" />
      <path d="M302 259 278 284m78-25 25 25" stroke="#f2bd53" strokeWidth="1.5" opacity=".7" />
      <g className="v-proof-tile" transform="translate(474 228)">
        <rect width="148" height="58" rx="7" fill="#f1ead7" stroke="#f2bd53" strokeWidth="1.5" />
        <rect x="6" y="6" width="42" height="46" rx="3" fill="#71906d" />
        <path d="M9 36 20 22l8 8 7-12 12 18v13H9z" fill="#c2c995" />
        <path d="M58 42c-7-4-7-13 0-17m5 21c-11-6-11-20 0-27m5 29c-15-9-15-25 0-33m4 34c18-10 18-28 0-37" fill="none" stroke="#406448" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M119 30v-5a6 6 0 0 0-12 0v5" fill="none" stroke="#406448" strokeWidth="2" />
        <rect x="104" y="29" width="19" height="17" rx="3" fill="#d9a344" stroke="#406448" strokeWidth="1.4" />
        <circle cx="113.5" cy="36" r="1.5" fill="#355d3e" /><path d="M113.5 38v3" stroke="#355d3e" strokeWidth="1.5" />
      </g>
    </svg>
  );
  if (kind === 1) return (
    <svg className="v-illustration" viewBox="0 0 660 310" role="img" aria-label="Tree crowns identified across a mapped village plot">
      <path d="M28 58h600v195H28z" rx="14" fill="#e4e6d5" /><path d="M50 91h556M50 151h556M50 213h556M119 71v165m122-165v165m125-165v165m127-165v165" stroke="#c4c9b6" strokeWidth="1" />
      <path d="M42 186q86-57 163 3t163-10 201 2" fill="none" stroke="#9ca9a0" strokeWidth="12" /><path d="M42 186q86-57 163 3t163-10 201 2" fill="none" stroke="#f5f0df" strokeWidth="2" strokeDasharray="8 9" />
      <g fill="#8c9890" stroke="#737f77" strokeWidth="1"><path d="M74 78h31v22H74zm8-10 8-8 8 8m75 56h38v26h-38zm7-9 12-9 12 9m183-48h36v25h-36zm8-9 10-8 10 8m102 73h39v24h-39zm7-9 12-8 12 8" /></g>
      {[ [145,109],[278,97],[328,131],[461,107],[549,129],[91,137],[202,194],[286,221],[397,193],[505,224],[576,183] ].map(([x,y],i)=><g key={i}><Crown x={x} y={y} r={13} lit /><circle cx={x} cy={y} r="19" fill="none" stroke="#d88e32" strokeWidth="2" />{i < 4 && <><rect x={x+13} y={y-26} width="36" height="17" rx="5" fill="#365e43" /><text x={x+31} y={y-14} fill="#fff8e8" fontSize="8" textAnchor="middle" fontFamily="monospace">T-{String(i+1).padStart(2,'0')}</text></>}</g>)}
      <path d="M73 272h514" stroke="#536d58" strokeWidth="1" strokeDasharray="3 5" />
      <g transform="translate(82 260)"><path d="M0 18h104" stroke="#485f4c" strokeWidth="2" /><path d="M12 18V8m20 10V4m20 14V0m20 18V10m20 8V6" stroke="#d99036" strokeWidth="4" /><path d="M7 22h96" stroke="#485f4c" strokeWidth="2" /></g>
      <path d="M502 267h72" stroke="#d99036" strokeWidth="2" /><path d="m568 261 9 6-9 6" fill="none" stroke="#d99036" strokeWidth="2" />
    </svg>
  );
  if (kind === 2) return (
    <svg className="v-illustration" viewBox="0 0 660 310" role="img" aria-label="Tree measurement translated into a carbon estimate and uncertainty range">
      <path d="M152 244h164" stroke="#73866c" strokeWidth="2" /><path d="M233 244V114" stroke="#795b3e" strokeWidth="12" strokeLinecap="round" /><path d="M233 142 194 173m39-39 41 31m-41 5-36 29m36-29 41 25" stroke="#795b3e" strokeWidth="7" strokeLinecap="round" />
      <Crown x={233} y={84} r={41} lit /><Crown x={198} y={105} r={28} lit /><Crown x={271} y={107} r={30} lit />
      <path d="M177 174q55 24 111 0" fill="none" stroke="#e2b34c" strokeWidth="5" /><path d="M177 168v12m111-12v12" stroke="#f6e7bd" strokeWidth="2" />
      <path d="M309 146h76" stroke="#d99036" strokeWidth="2" /><path d="m376 139 10 7-10 7" fill="none" stroke="#d99036" strokeWidth="2" />
      <g transform="translate(397 75)"><rect width="188" height="117" rx="14" fill="#f1ead6" stroke="#d6cdae" /><text x="20" y="70" fill="#536650" fontSize="12" fontFamily="monospace">t CO₂</text><path d="M20 91h145" stroke="#c7c9b3" /><circle cx="110" cy="91" r="6" fill="#d99036" /></g>
      <g transform="translate(370 228)"><text x="0" y="0" fill="#526c53" fontSize="10" fontFamily="monospace">LOW</text><text x="91" y="0" fill="#526c53" fontSize="10" fontFamily="monospace">LIKELY</text><text x="190" y="0" fill="#526c53" fontSize="10" fontFamily="monospace">HIGH</text><path d="M7 24h204" stroke="#aeb69e" strokeWidth="5" strokeLinecap="round" /><path d="M63 24h91" stroke="#e7b44b" strokeWidth="10" strokeLinecap="round" /><circle cx="109" cy="24" r="7" fill="#355d3e" stroke="#f4edda" strokeWidth="2" /></g>
      <path d="M436 281h124" stroke="#bdc1ab" strokeWidth="1" /><path d="M437 277v8m123-8v8" stroke="#bdc1ab" />
    </svg>
  );
  return (
    <svg className="v-illustration" viewBox="0 0 660 310" role="img" aria-label="AI-assisted documents approved by a person and secured in a registry">
      <g className="v-seq-doc" transform="translate(71 92)"><rect x="12" y="11" width="126" height="151" rx="8" fill="#d4d8c7" /><rect x="0" y="0" width="126" height="151" rx="8" fill="#f1ead7" stroke="#c6cbb8" /><path d="M22 31h75M22 48h56M22 69h79M22 86h62M22 107h70" stroke="#aeb6a2" strokeWidth="3" strokeLinecap="round" /><path d="m100 112 9 8 17-23" fill="none" stroke="#c58a35" strokeWidth="4" /></g>
      <g transform="translate(230 113)" className="v-spark"><path d="M27 0 33 22 55 28 33 34 27 56 21 34 0 28 21 22z" fill="#dca641" /><path d="M67 6 71 19 84 23 71 27 67 40 63 27 50 23 63 19z" fill="#8ca36d" /></g>
      <path d="M288 173h64" stroke="#d99036" strokeWidth="2" /><path d="m343 166 10 7-10 7" fill="none" stroke="#d99036" strokeWidth="2" />
       <g className="v-seq-approval" transform="translate(365 87)"><rect width="117" height="147" rx="8" fill="#f1ead7" stroke="#c6cbb8" /><path d="M22 31h72M22 49h62M22 67h72M22 85h48" stroke="#aeb6a2" strokeWidth="3" strokeLinecap="round" /><circle cx="59" cy="111" r="24" fill="none" stroke="#b85e45" strokeWidth="3" /><path d="m46 112 9 8 18-21" fill="none" stroke="#b85e45" strokeWidth="3" /></g>
      <path d="M493 160h44" stroke="#d99036" strokeWidth="2" /><path d="m528 153 10 7-10 7" fill="none" stroke="#d99036" strokeWidth="2" />
      <g className="v-seq-ledger" transform="translate(548 88)"><path d="M9 15h76v124H9z" fill="#436b4b" stroke="#d7dfc6" strokeWidth="2" /><path d="M22 29h50m-50 15h50m-50 15h50m-50 15h50m-50 15h50" stroke="#b9c7a4" strokeWidth="2" /><rect x="28" y="102" width="38" height="28" rx="5" fill="#e7b54b" /><path d="M38 102v-8a9 9 0 0 1 18 0v8m-9 9v8" fill="none" stroke="#355d3e" strokeWidth="3" /></g>
      <path d="M79 270h506" stroke="#9eaa91" strokeDasharray="3 6" /><circle cx="131" cy="270" r="4" fill="#d99036" /><circle cx="423" cy="270" r="4" fill="#d99036" /><circle cx="587" cy="270" r="4" fill="#d99036" />
    </svg>
  );
}

function TileIcon({ icon }: { icon: string }) {
  const paths: Record<string, React.ReactNode> = {
    history: <><path d="M5 7h14M5 12h10M5 17h8" /><path d="M17 15v5m-2-2 2 2 2-2" /></>,
    height: <><path d="M5 19V5m0 14h14M9 16V9m4 7V5m4 11v-4" /><path d="m7 7 2-2 2 2" /></>,
    boundary: <><path d="m4 7 6-3 5 3 5-2v13l-5 2-5-3-6 2z" /><path d="m10 4v13m5-10v13" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" /></>,
    mask: <><path d="M4 6h16M4 12h7m-7 6h16" /><path d="m14 10 6 6m0-6-6 6" /></>,
    crown: <><circle cx="12" cy="12" r="8" /><path d="M8 13c1-4 7-4 8 0m-5-2h.01M14 11h.01" /></>,
    leaf: <><path d="M20 4C8 4 4 10 5 18c7 3 15-2 15-14Z" /><path d="M5 19c3-5 7-8 12-11" /></>,
    tape: <><path d="M5 8h14v9H5zM8 8V5h8v3" /><path d="M9 11v3m3-3v2m3-2v3" /></>,
    equation: <><path d="M6 7h12M6 12h12M6 17h12" /><path d="m9 5 2 4m0-4L9 9m5 5 2 4m0-4-2 4" /></>,
    growth: <><path d="M4 18V6m0 12h16" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>,
    buffer: <><path d="M12 3 20 7v5c0 5-3 8-8 9-5-1-8-4-8-9V7z" /><path d="M8 12h8" /></>,
    document: <><path d="M7 4h7l4 4v12H7z" /><path d="M14 4v5h5M10 13h5m-5 3h5" /></>,
    passport: <><rect x="5" y="4" width="14" height="16" rx="2" /><circle cx="12" cy="11" r="3" /><path d="M8 17h8" /></>,
    verify: <><path d="M4 5h16v12H4zM8 21h8m-4-4v4" /><path d="m8 11 2 2 5-5" /></>,
    registry: <><path d="M4 8h16v12H4zM3 5h18l-2 3H5z" /><path d="M8 12h8m-8 4h8" /></>,
  };
  return <svg className="v-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[icon] ?? paths.document}</svg>;
}

export function Visual() {
  const layerRefs = useRef<(HTMLElement | null)[]>([]);
  const [dotPosition, setDotPosition] = useState(0);
  const [seen, setSeen] = useState<boolean[]>([false, false, false, false]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const pipelineRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const nodes = layerRefs.current.filter(Boolean) as HTMLElement[];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) setSeen([true, true, true, true]);
    if (!('IntersectionObserver' in window)) { setSeen([true, true, true, true]); return; }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const index = Number((entry.target as HTMLElement).dataset.layerIndex);
        if (entry.isIntersecting) {
          if (!reduceMotion) setSeen(prev => prev[index] ? prev : prev.map((value, i) => i === index || value));
        }
      });
    }, { threshold: .3, rootMargin: '-8% 0px -18% 0px' });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const updatePosition = () => {
      const pipeline = pipelineRef.current;
      const rail = railRef.current;
      if (!pipeline || !rail) return;
      const bounds = pipeline.getBoundingClientRect();
      const railBounds = rail.getBoundingClientRect();
      const anchor = window.innerHeight * 0.48;
      const alongRail = Math.max(0, Math.min(railBounds.height, anchor - railBounds.top));
      setDotPosition(railBounds.top - bounds.top + alongRail - 9);
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);
  const toggleTile = (id: string) => setFlipped(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  return (
    <div className="vision-visual" data-testid="page-vision">
      <style>{`
        .vision-visual{--vf:hsl(var(--forest));--vp:hsl(var(--paper));--vm:hsl(var(--marigold));--vl:hsl(var(--leaf));background:var(--vf);color:var(--vp);min-height:100dvh;overflow:hidden;font-family:var(--app-font-sans)}
        .vision-visual *{box-sizing:border-box}.v-shell{max-width:1160px;margin:auto;padding:clamp(28px,6vw,76px) 28px 54px}
        .v-eyebrow{color:var(--vm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin:0 0 15px}
        .v-title{font-family:var(--app-font-serif);font-weight:500;font-size:clamp(40px,6.2vw,76px);line-height:.98;letter-spacing:-.045em;max-width:890px;margin:0}
        .v-hero-art{width:100%;margin:32px auto 60px;max-width:900px;display:block}
        .v-illustration{width:100%;height:auto;display:block;max-height:340px}
        .v-pipeline{position:relative;padding-left:76px}
        .v-rail{position:absolute;left:22px;top:35px;bottom:140px;width:2px;background:linear-gradient(to bottom,rgba(242,189,83,.65),rgba(242,189,83,.18));z-index:0}
        .v-rail-dot{position:absolute;left:14px;top:35px;width:18px;height:18px;border-radius:50%;background:var(--vm);border:4px solid var(--vf);box-shadow:0 0 0 1px var(--vm),0 0 24px rgba(232,174,63,.6);z-index:0;pointer-events:none}
        .v-layer{position:relative;z-index:1;margin:0 0 78px;padding:0 0 50px;border-bottom:1px solid rgba(244,239,221,.18);opacity:.68;transform:translateY(20px);transition:opacity .7s ease,transform .7s ease}
        .v-layer.is-seen{opacity:1;transform:translateY(0)}.v-layer:last-child{border:0;margin-bottom:28px}
        .v-head{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:14px}
        .v-layer h2{font:500 clamp(28px,3.6vw,43px)/1.05 var(--app-font-serif);letter-spacing:-.025em;margin:0}
        .v-metric{display:flex;align-items:baseline;gap:12px;text-align:left;color:var(--vm);font:500 clamp(26px,4vw,43px)/.95 var(--app-font-serif);white-space:nowrap}
        .v-metric small{display:inline-block;color:rgba(244,239,221,.72);font:500 11px var(--app-font-mono);letter-spacing:.06em;margin:0}
        .v-art-frame{margin:16px 0 26px;padding:14px 18px 8px;border-radius:20px;background:rgba(241,234,215,.08);border:1px solid rgba(241,234,215,.12);overflow:hidden}
        .v-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .v-tile{min-width:0;min-height:118px;perspective:800px}
        .v-tile button{width:100%;height:100%;min-height:118px;position:relative;border:0;padding:0;background:transparent;color:inherit;text-align:left;cursor:pointer;perspective:800px}
        .v-tile-inner{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.2,.75,.2,1)}
        .v-tile.is-flipped .v-tile-inner{transform:rotateY(180deg)}
        @media(hover:hover) and (pointer:fine){.v-tile:hover .v-tile-inner{transform:rotateY(180deg)}}
        .v-tile button:focus-visible{outline:3px solid var(--vm);outline-offset:4px;border-radius:16px}
        .v-tile-face{position:absolute;inset:0;backface-visibility:hidden;border:1px solid rgba(244,239,221,.22);border-radius:15px;padding:15px 14px;background:rgba(244,239,221,.07);display:flex;flex-direction:column;justify-content:space-between}
        .v-tile-face.back{transform:rotateY(180deg);background:rgba(220,166,65,.15);border-color:rgba(220,166,65,.55);justify-content:center}
        .v-tile-icon{width:25px;height:25px;color:var(--vm);flex:none}
        .v-tile-label{font-size:14px;font-weight:600;line-height:1.18;max-width:150px}
        .v-tile-backtext{font:500 11px/1.5 var(--app-font-mono);color:#f4cf82;overflow-wrap:anywhere}
        .v-footer{border-top:1px solid rgba(244,239,221,.22);padding-top:25px;margin-top:12px}
        .v-footer p{font:500 17px/1.7 var(--app-font-serif);margin:0;max-width:780px;color:rgba(244,239,221,.88)}
        .v-footer a{color:var(--vm);text-decoration-color:rgba(220,166,65,.5);text-underline-offset:4px}
        .v-actions{display:flex;gap:12px;margin-top:21px;flex-wrap:wrap}
        .v-button{display:inline-flex;min-height:50px;align-items:center;justify-content:center;padding:0 21px;border-radius:12px;text-decoration:none!important;font-weight:700;font-size:14px;transition:transform .2s,background .2s}
        .v-button:hover{transform:translateY(-2px)}.v-button.primary{color:#26362b;background:var(--vm)}.v-button.secondary{color:var(--vp);border:1px solid rgba(244,239,221,.42)}
        .v-crown{fill:#79936c;stroke:#a6bb8e;stroke-width:1}.v-crown.lit{fill:#dba545;stroke:#ffe19a;filter:drop-shadow(0 0 5px rgba(235,184,75,.55))}
        .v-hero-art .v-crown.lit{animation:v-crown-on .75s both}
        .v-layer.is-seen .v-crown.lit{animation:v-crown-on .75s both}.v-layer.is-seen .v-crown.lit:nth-of-type(2){animation-delay:.2s}.v-layer.is-seen .v-crown.lit:nth-of-type(3){animation-delay:.45s}
        .v-scanring{transform-origin:center;animation:v-ring 4s ease-in-out infinite}.v-satellite{transform-origin:130px 60px;animation:v-orbit 8s ease-in-out infinite}.v-drone{animation:v-hover 3s ease-in-out infinite}
        .v-layer.is-seen .v-seq-doc{animation:v-doc-in .65s both}.v-layer.is-seen .v-seq-approval{animation:v-doc-in .65s .28s both}.v-layer.is-seen .v-seq-ledger{animation:v-doc-in .65s .56s both}
        @keyframes v-crown-on{0%{opacity:.18;transform:scale(.7)}100%{opacity:1;transform:scale(1)}}@keyframes v-ring{50%{transform:scale(1.1);opacity:.45}}
        @keyframes v-orbit{50%{transform:translate(110px,14px) rotate(8deg)}}@keyframes v-hover{50%{transform:translateY(-8px)}}@keyframes v-spark{50%{transform:translateY(-5px) rotate(8deg)}}
        @keyframes v-doc-in{from{opacity:.2;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:700px){.v-shell{padding:31px 18px 40px}.v-title{font-size:clamp(39px,10vw,58px);max-width:550px}.v-hero-art{margin:20px auto 42px}.v-pipeline{padding-left:0}.v-rail{left:50%;top:0;bottom:120px;transform:translateX(-50%);opacity:.14}.v-rail-dot{left:calc(50% - 9px);opacity:.48}.v-layer{padding-top:28px;margin-bottom:50px}.v-head{align-items:center;gap:10px;text-align:center}.v-metric{flex-direction:column;gap:0;text-align:center}.v-metric small{display:block;margin-top:6px}.v-art-frame{padding:6px 3px 1px;margin:12px -3px 18px;border-radius:14px}.v-tiles{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.v-tile,.v-tile button{min-height:112px}.v-tile-face{padding:13px 11px}.v-tile-label{font-size:13px}.v-footer p{font-size:16px}.v-actions{display:grid;grid-template-columns:1fr}.v-button{width:100%}}
        @media(prefers-reduced-motion:reduce){.vision-visual *, .vision-visual *::before,.vision-visual *::after{animation:none!important;scroll-behavior:auto!important;transition:none!important}.v-layer,.v-layer.is-seen{opacity:1!important;transform:none!important}.v-crown,.v-crown.lit{opacity:1!important;transform:none!important}.v-satellite,.v-drone,.v-scanring{transform:none!important}}
      `}</style>
      <main className="v-shell">
        <header>
          <h1 className="v-title">From satellite ranges to tree-by-tree proof</h1>
          <svg className="v-hero-art" viewBox="0 0 660 310" role="img" aria-label="A satellite and scanning drone map farm plots as tree crowns light up">
            <defs><pattern id="heroGrid" width="30" height="21" patternUnits="userSpaceOnUse"><path d="M0 0H30M0 0V21" fill="none" stroke="#a6c38b" strokeWidth="1" opacity=".4" /></pattern></defs>
            <path d="m35 197 155-91 204 7 220 75-154 80-220-7z" fill="#345d3e" stroke="#d7d9a9" strokeWidth="2" /><path d="m35 197 155-91 204 7 220 75-154 80-220-7z" fill="url(#heroGrid)" />
            <path d="M69 185 222 124m4 133 146-123m44 124 150-87" stroke="#e1bd6c" strokeWidth="2" strokeDasharray="5 7" opacity=".7" />
            {[[117,188],[166,157],[216,204],[265,163],[313,211],[366,176],[415,218],[465,185],[514,207],[190,228],[347,141],[482,137]].map(([x,y],i)=><Crown key={i} x={x} y={y} r={i%3===0?11:9} lit delay={i*.11} />)}
            <g className="v-satellite" transform="translate(77 29)"><path d="M20 21 42 43m-25-7-12 12m44-31 12-12" stroke="#f2bd53" strokeWidth="2" /><rect x="22" y="18" width="20" height="20" rx="4" fill="#f2bd53" transform="rotate(45 32 28)" /><path d="M0 7h17v19H0zm50 22h17v19H50z" fill="#7594a0" stroke="#e7e3d4" /><path d="M15 45q19 14 38 0" fill="none" stroke="#f2bd53" strokeDasharray="3 4" /></g>
            <g className="v-drone" transform="translate(479 64)"><path d="M8 20h40M28 8v24M12 15 5 9m36 6 7-6" stroke="#f6f0dd" strokeWidth="2" /><rect x="20" y="13" width="16" height="13" rx="4" fill="#f2bd53" /><circle cx="5" cy="8" r="4" fill="none" stroke="#f6f0dd" /><circle cx="49" cy="8" r="4" fill="none" stroke="#f6f0dd" /><path d="M28 27v55" stroke="#f2bd53" strokeDasharray="3 4" /></g>
            <circle cx="355" cy="210" r="45" fill="none" stroke="#f2bd53" strokeWidth="1.5" strokeDasharray="3 5" className="v-scanring" />
            <g transform="translate(540 36)" fill="none" stroke="#f2bd53" strokeWidth="2"><path d="M0 14q14-14 28 0-14 14-28 0Zm14-14v28" /><circle cx="14" cy="14" r="4" fill="#f2bd53" /></g>
          </svg>
        </header>
        <div className="v-pipeline" ref={pipelineRef}>
          <div className="v-rail" ref={railRef} aria-hidden="true" />
          <span className="v-rail-dot" aria-hidden="true" style={{ top: `${dotPosition}px` }} />
          {layers.map((layer, index) => (
            <section key={layer.title} ref={node => { layerRefs.current[index] = node; }} data-layer-index={index} className={`v-layer ${seen[index] ? 'is-seen' : ''}`} aria-labelledby={`vision-layer-${index}`}>
              <div className="v-head"><div><h2 id={`vision-layer-${index}`}>{layer.title}</h2></div><div className="v-metric">{layer.metric}{layer.caption && <small>{layer.caption}</small>}</div></div>
              <div className="v-art-frame"><Illustration kind={layer.kind} /></div>
              <div className="v-tiles">
                {layer.tiles.map((tile, tileIndex) => {
                  const id = `${index}-${tileIndex}`;
                  const isFlipped = flipped.includes(id);
                  return <div className={`v-tile ${isFlipped ? 'is-flipped' : ''}`} key={tile.label}>
                    <button type="button" aria-label={`${tile.label}. Tap to ${isFlipped ? 'hide' : 'show'} technical detail.`} aria-pressed={isFlipped} onClick={() => toggleTile(id)} onKeyDown={event => { if (event.key === 'Escape') setFlipped(prev => prev.filter(item => item !== id)); }}>
                      <span className="v-tile-inner">
                        <span className="v-tile-face"><TileIcon icon={tile.icon} /><span className="v-tile-label">{tile.label}</span></span>
                        <span className="v-tile-face back"><span className="v-tile-backtext">{tile.detail}</span></span>
                      </span>
                    </button>
                  </div>;
                })}
              </div>
            </section>
          ))}
        </div>
        <footer className="v-footer">
          <p>This is where ZeroCarbon is heading. Try what is live today on <a href="/scan">Scan</a>, <a href="/market">Market</a> and <a href="/pricing">Pricing</a>.</p>
          <div className="v-actions"><a className="v-button primary" href="/scan">Check my land <span aria-hidden="true">→</span></a><a className="v-button secondary" href="/market">See the market <span aria-hidden="true">→</span></a></div>
        </footer>
      </main>
    </div>
  );
}

export default Visual;
