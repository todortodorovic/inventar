"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import type { ReactNode } from "react"
import { siteConfig, type Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Small pieces the overview's tiles and panels share: a money figure that
 * shortens on phones, the ▲/▼ change line and the "open section" link.
 */

/** From this size up a phone tile shows the amount shortened. */
const COMPACT_FROM = 100_000

/**
 * Whether a row of money tiles shortens its amounts on phones: all of them
 * when any one is large, so a row never mixes `276,5 hilj. RSD` with `72.040 RSD`.
 */
export const compactRow = (...amounts: number[]) => amounts.some((a) => Math.abs(a) >= COMPACT_FROM)

const compactFormats = new Map<Locale, Intl.NumberFormat>()

/** `276,5 hilj. RSD` / `RSD 276.5k`: the locale's own currency pattern, with the code set smaller. */
function CompactMoney({ amount, locale }: { amount: number; locale: Locale }) {
  let format = compactFormats.get(locale)
  if (!format) {
    format = new Intl.NumberFormat(siteConfig.localeTags[locale], {
      style: "currency",
      currency: siteConfig.currency,
      currencyDisplay: "code",
      notation: "compact",
      maximumFractionDigits: 1,
    })
    compactFormats.set(locale, format)
  }
  return (
    <>
      {format.formatToParts(amount).map((part, i) =>
        part.type === "currency" ? (
          <span key={i} className="text-[0.55em] font-medium tracking-normal text-fg-muted">
            {part.value}
          </span>
        ) : (
          part.value
        ),
      )}
    </>
  )
}

/**
 * Full amount from `sm` up; compact on phones, where tiles are two abreast.
 * `compact` lets a row decide for all its tiles (see `compactRow`); by
 * default an amount decides for itself.
 */
export function Money({ amount, locale, compact }: { amount: number; locale: Locale; compact?: boolean }) {
  const full = formatMoney(amount, locale)
  if (!(compact ?? compactRow(amount))) return <>{full}</>
  return (
    <>
      <span className="sm:hidden">
        <CompactMoney amount={amount} locale={locale} />
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
      <span className="text-fg-faint" aria-hidden>
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
        <span className="font-medium text-fg-soft">{dict.same}</span>
      ) : (
        <span className={cn("inline-flex items-center gap-0.5 rounded-[5px] px-1 font-semibold whitespace-nowrap tabular-nums", dir === "up" ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss")}>
          <span aria-hidden className="text-[0.85em]">{dir === "up" ? "↑" : "↓"}</span>
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
        "group/link -mt-1 -mr-2 inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-fg-soft underline decoration-fg/20 underline-offset-4 transition-colors outline-none hover:bg-sunken hover:text-fg hover:decoration-fg/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring max-md:min-h-10",
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
  return <p className="px-4 py-10 text-center text-[13px] text-pretty text-fg-muted sm:px-5">{children}</p>
}
