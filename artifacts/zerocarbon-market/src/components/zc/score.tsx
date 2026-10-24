export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} data-testid="text-score" aria-label={`ZeroCarbon Score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--forest))" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-sm font-bold">{score}</span>
        <span className="text-[8px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}
