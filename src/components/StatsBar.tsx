export interface StatItem {
  label: string;
  value: string;
}

interface StatsBarProps {
  ariaLabel: string;
  stats: StatItem[];
  highlightedLabel?: string;
}

export function StatsBar({
  ariaLabel,
  stats,
  highlightedLabel,
}: StatsBarProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="grid min-w-0 grid-flow-col auto-cols-[minmax(8rem,1fr)] gap-2 overflow-x-auto"
    >
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className={`flex min-h-[68px] flex-col items-center justify-center rounded-lg border px-3 py-2 ${
            label === highlightedLabel
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-border/80 bg-card"
          }`}
        >
          <span className="text-xl font-semibold leading-tight tabular-nums text-foreground">
            {value}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </section>
  );
}
