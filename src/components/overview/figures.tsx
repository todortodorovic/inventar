"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import type { ReactNode } from "react"
import { siteConfig, type Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatMoneyCompact, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Small pieces the overview's tiles and panels share: a money figure that
 * shortens on phones, the ▲/▼ change line and the "open section" link.
 */

/** Full amount from `sm` up; compact (`312,5 hilj. RSD`) on phones, where tiles are two abreast. */
export function Money({ amount, locale }: { amount: number; locale: Locale }) {
  const full = formatMoney(amount, locale)
  if (Math.abs(amount) < 100_000) return <>{full}</>
  return (
    <>
      <span className="sm:hidden">
        {formatMoneyCompact(amount, locale)}
        <span className="ml-1 text-[0.6em] tracking-normal text-ink-muted">{siteConfig.currency}</span>
      </span>
      <span className="hidden sm:inline">{full}</span>
    </>
  )
}

/**
 * Change against the previous period: `▲ 12%` in gain / `▼ 8%` in loss, then
 * what it is compared with. `points` shows a difference of ratios in
 * percentage points (for margins). `null` means there is nothing to compare.
 */
export function Delta({
  change,
  points,
  against,
  dict,
  locale,
}: {
  change: number | null
  points?: boolean
  against: string
  dict: Dictionary["overview"]["delta"]
  locale: Locale
}) {
  let badge: ReactNode
  if (change === null) {
    badge = (
      <span className="text-ink-faint" aria-hidden>
        —
      </span>
    )
  } else {
    const size = points ? fill(dict.points, { n: Math.round(Math.abs(change) * 100) }) : formatPercent(Math.abs(change), locale)
    // Both a relative change and a margin difference read in whole percent.
    const shown = Math.round(change * 100)
    const dir = shown > 0 ? "up" : shown < 0 ? "down" : "same"
    badge =
      dir === "same" ? (
        <span className="font-semibold text-ink-muted">{dict.same}</span>
      ) : (
        <span className={cn("font-semibold whitespace-nowrap tabular-nums", dir === "up" ? "text-gain" : "text-loss")}>
          <span aria-hidden>{dir === "up" ? "▲" : "▼"} </span>
          <span className="sr-only">{dict[dir]} </span>
          {size}
        </span>
      )
  }
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5">
      {badge}
      <span>{change === null ? dict.none : against}</span>
    </span>
  )
}

/** Quiet text link with an arrow, for "see everything" in a panel header. */
export function SectionLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group/link -mr-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ink-soft transition-colors outline-none hover:bg-ink/6 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {children}
      <ArrowRightIcon className="size-3.5 transition-transform group-hover/link:translate-x-0.5" aria-hidden />
    </Link>
  )
}

/** A panel's quiet "nothing here" line, for lists inside a populated page. */
export function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-pretty text-ink-muted sm:px-6">{children}</p>
}
