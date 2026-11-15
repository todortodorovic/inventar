"use client"

import { TriangleAlertIcon } from "lucide-react"
import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
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
      <Input inputMode="numeric" autoComplete="off" className="pr-12 tabular-nums" {...props} />
      <span
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px] font-medium text-fg-faint"
        aria-hidden
      >
        {siteConfig.currency}
      </span>
    </div>
  )
}

/**
 * The live "what this does" box under a form: a grey well, rows of label → figure.
 * The box itself is not a live region (every keystroke would re-read all of it);
 * `announce` is the one line screen readers hear, once typing pauses.
 */
export function Preview({ title, announce, children }: { title: ReactNode; announce?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-sunken px-4 py-3">
      <p className="mb-2 type-overline">{title}</p>
      <dl className="flex flex-col gap-1.5">{children}</dl>
      {announce !== undefined && <Announcement text={announce} />}
    </div>
  )
}

const ANNOUNCE_DELAY_MS = 800

/** A polite status line that speaks `text` only after it has stopped changing for a moment. */
function Announcement({ text }: { text: string }) {
  // Starts with the opening value, which is not read out: only changes are.
  const [spoken, setSpoken] = useState(text)
  useEffect(() => {
    const timer = setTimeout(() => setSpoken(text), ANNOUNCE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [text])
  return (
    <p role="status" className="sr-only">
      {spoken}
    </p>
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
      <dt className="min-w-0 text-[13px] text-fg-muted">{label}</dt>
      <dd
        className={cn(
          "shrink-0 text-right tabular-nums",
          strong ? "text-[17px] font-semibold tracking-[-0.01em]" : "text-[13.5px] font-medium",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
          tone === "muted" && "text-fg-faint",
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
    <p className="flex items-start gap-2 rounded-md border border-status-pending/25 bg-status-pending-soft px-3 py-2.5 text-[13px] leading-snug text-status-pending-ink">
      <TriangleAlertIcon className="mt-px size-4 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

/** Gain/loss tone for a signed amount. */
export const toneOf = (n: number) => (n > 0 ? "gain" : n < 0 ? "loss" : "default") as "gain" | "loss" | "default"
