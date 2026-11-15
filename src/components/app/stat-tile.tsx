import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * One headline number: a quiet label, the figure (the hero), a line under it.
 * `tone` colours the value for profit (gain) / loss. `trend` draws a small
 * sparkline of the recent past beside the figure. `edge` paints a 3px top
 * edge in a status or stock-state colour (e.g. `var(--status-pending)` on the
 * "Za slanje" tile) so a row of tiles reads at a glance.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  accent,
  trend,
  edge,
  className,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: "default" | "gain" | "loss"
  /** A small coloured key before the label, e.g. `var(--chart-1)`. */
  accent?: string
  /** Oldest → newest values for a sparkline (decorative; the figure carries the meaning). */
  trend?: number[]
  /** A colour for the tile's top edge, e.g. `var(--status-sent)`. */
  edge?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "@container relative flex min-w-0 flex-col gap-1 overflow-hidden rounded-(--radius-card) border border-hairline bg-card px-4 pt-3.5 pb-4 shadow-card sm:px-5 sm:pt-4",
        className,
      )}
    >
      {edge && <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: edge }} aria-hidden />}
      <div className="flex min-h-5 min-w-0 items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium text-fg-muted">
          {accent && <span className="size-2 shrink-0 rounded-[2px]" style={{ background: accent }} aria-hidden />}
          <span className="truncate">{label}</span>
        </p>
        {trend && trend.length > 1 && <Sparkline values={trend} tone={tone} />}
      </div>
      <p
        className={cn(
          "min-w-0 truncate pt-1 type-figure @max-[230px]:text-[21px] @max-[230px]:leading-7",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </p>
      {hint && <div className="mt-1 text-[12.5px] leading-snug text-fg-muted">{hint}</div>}
    </div>
  )
}

const W = 72
const H = 22

function Sparkline({ values, tone }: { values: number[]; tone: "default" | "gain" | "loss" }) {
  const id = useId()
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const step = W / (values.length - 1)
  const pts = values.map((v, i) => [i * step, 3 + (1 - (v - lo) / span) * (H - 6)] as const)
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("")
  const color = tone === "loss" ? "var(--loss)" : tone === "gain" ? "var(--gain)" : "var(--fg-faint)"
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="-my-1 hidden shrink-0 overflow-visible sm:block" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.14" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${W},${H}L0,${H}Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.25" fill="var(--surface)" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}
