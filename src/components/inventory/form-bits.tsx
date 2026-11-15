"use client"

import { TriangleAlertIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { Input } from "@/components/ui/input"
import type { Dictionary } from "@/content/types"
import { siteConfig } from "@/config/site"
import { fill, parseAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

type Validation = Dictionary["common"]["validation"]

/**
 * Reads a money/quantity field. Returns the number (or null) and the message
 * to show under the field; empty optional fields count as `fallback`.
 */
export function readAmount(
  text: string,
  v: Validation,
  { min = 0, max, required = true, fallback = 0 }: { min?: number; max?: number; required?: boolean; fallback?: number } = {},
): { value: number | null; error?: string } {
  if (!text.trim()) return required ? { value: null, error: v.required } : { value: fallback }
  const value = parseAmount(text)
  if (value === null) return { value: null, error: v.wholeNumber }
  if (value < min) return { value: null, error: fill(v.min, { min }) }
  if (max !== undefined && value > max) return { value: null, error: fill(v.max, { max }) }
  return { value }
}

/** A numeric field with the currency code inside its right edge. */
export function MoneyInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Input inputMode="numeric" autoComplete="off" className="pr-14 tabular-nums" {...props} />
      <span
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[11px] font-medium tracking-[0.12em] text-ink-faint"
        aria-hidden
      >
        {siteConfig.currency}
      </span>
    </div>
  )
}

/** The live "what this does" box under a form, on sand like Catena's builder summary. */
export function Preview({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div aria-live="polite" className="rounded-2xl bg-sand px-4 py-3.5">
      <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">{title}</p>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </div>
  )
}

export function PreviewRow({
  label,
  value,
  tone = "default",
  strong,
}: {
  label: ReactNode
  value: ReactNode
  tone?: "default" | "gain" | "loss" | "muted"
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="min-w-0 text-sm text-ink-soft">{label}</dt>
      <dd
        className={cn(
          "shrink-0 text-right tabular-nums",
          strong ? "font-display text-lg font-bold tracking-[-0.02em]" : "text-[15px] font-semibold",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
          tone === "muted" && "text-ink-faint",
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/** A soft warning that does not block saving. */
export function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-status-pending-soft px-3 py-2.5 text-[13px] leading-snug text-[oklch(0.42_0.1_65)]">
      <TriangleAlertIcon className="mt-px size-4 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

/** Gain/loss tone for a signed amount. */
export const toneOf = (n: number) => (n > 0 ? "gain" : n < 0 ? "loss" : "default") as "gain" | "loss" | "default"
