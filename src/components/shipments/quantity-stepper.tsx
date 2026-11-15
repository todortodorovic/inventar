"use client"

import { MinusIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** − n + within [min, max]; the ends disable themselves so the count never leaves the range. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  decreaseLabel,
  increaseLabel,
  className,
}: {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  /** Accessible name of the whole control, e.g. "Quantity of AirPods". */
  label: string
  decreaseLabel: string
  increaseLabel: string
  className?: string
}) {
  const step = (by: number) => onChange(Math.min(max, Math.max(min, value + by)))
  const button =
    "grid size-10 place-items-center rounded-[6px] text-fg-soft transition-colors outline-none hover:bg-surface hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35 md:size-8"
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-md bg-sunken p-0.5 ring-1 ring-hairline ring-inset", className)}>
      <button type="button" className={button} onClick={() => step(-1)} disabled={value <= min} aria-label={decreaseLabel}>
        <MinusIcon className="size-4" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-[14px] font-semibold tabular-nums">
        {value}
      </output>
      <button type="button" className={button} onClick={() => step(1)} disabled={value >= max} aria-label={increaseLabel}>
        <PlusIcon className="size-4" aria-hidden />
      </button>
    </div>
  )
}
