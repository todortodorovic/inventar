"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type Chip<T extends string> = { value: T; label: ReactNode; count?: number }

/**
 * Single-choice filter chips (status, period, category…), styled like the
 * header's language switch. Scrolls sideways on narrow screens.
 */
export function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  /** Accessible name of the group. */
  label: string
  value: T
  onChange: (value: T) => void
  options: Chip<T>[]
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-ink/6 p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((o) => {
        const checked = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap text-ink-muted transition-colors hover:text-ink aria-checked:bg-white aria-checked:text-ink aria-checked:shadow-[0_1px_3px_rgb(22_22_26/0.12)]"
          >
            {o.label}
            {o.count !== undefined && (
              <span className="rounded-full bg-ink/8 px-1.5 py-px font-mono text-[11px] tabular-nums">{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
