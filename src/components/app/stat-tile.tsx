import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * One headline number: mono label, big display value, a quiet line under it.
 * `tone` colours the value for profit (gain) / loss.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  accent,
  className,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: "default" | "gain" | "loss"
  /** A small coloured dot before the label, e.g. `var(--chart-1)`. */
  accent?: string
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-(--radius-card) border border-line bg-card p-5", className)}>
      <p className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">
        {accent && <span className="size-2 shrink-0 rounded-full" style={{ background: accent }} aria-hidden />}
        {label}
      </p>
      <p
        className={cn(
          "truncate font-display text-[clamp(24px,2.4vw,32px)] leading-none font-bold tracking-[-0.035em] tabular-nums",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[13px] leading-snug text-ink-muted">{hint}</p>}
    </div>
  )
}
