"use client"

import type { ReactNode } from "react"
import { useApp } from "@/components/app/app-provider"
import { profitText } from "@/components/app/money"
import { StatTile } from "@/components/app/stat-tile"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, plural } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Totals } from "./filters"

/**
 * Headline numbers for everything on the shelf (not just what the filters show).
 * From 640px: four stat tiles. Phones: one compact card (figures only), so the
 * search and the first article still fit in the first screen.
 */
export function InventorySummary({
  totals,
  piecesInShipments,
  dict,
}: {
  totals: Totals
  piecesInShipments: number
  dict: Dictionary["inventory"]
}) {
  const { t, locale } = useApp()
  const shippedHint =
    piecesInShipments > 0
      ? fill(dict.summary.inShipments, { pieces: plural(t.units.pieces, piecesInShipments, locale) })
      : dict.summary.noneInShipments
  const profitTone = totals.profit > 0 ? "gain" : totals.profit < 0 ? "loss" : "default"

  return (
    <>
      <div className="rounded-(--radius-card) border border-hairline bg-card px-4 py-3.5 shadow-card sm:hidden">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Figure label={dict.summary.articles}>
            {formatNumber(totals.articles, locale)}
            <span className="ml-1.5 text-[12.5px] font-normal tracking-normal text-fg-muted">
              · {plural(t.units.pieces, totals.pieces, locale)}
            </span>
          </Figure>
          <Figure label={dict.summary.cost}>{formatMoney(totals.cost, locale)}</Figure>
          <Figure label={dict.summary.value}>{formatMoney(totals.value, locale)}</Figure>
          <Figure label={dict.summary.profit} className={profitText(totals.profit, "")}>
            {formatMoney(totals.profit, locale)}
          </Figure>
        </dl>
        {piecesInShipments > 0 && (
          <p className="mt-3 border-t border-hairline pt-2.5 text-[12.5px] leading-snug text-fg-muted">
            {shippedHint}
          </p>
        )}
      </div>

      <div className="grid gap-3 max-sm:hidden sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <StatTile
          label={dict.summary.articles}
          value={formatNumber(totals.articles, locale)}
          hint={fill(dict.summary.articlesHint, { pieces: plural(t.units.pieces, totals.pieces, locale) })}
        />
        <StatTile label={dict.summary.cost} value={formatMoney(totals.cost, locale)} hint={dict.summary.costHint} />
        <StatTile label={dict.summary.value} value={formatMoney(totals.value, locale)} hint={dict.summary.valueHint} />
        <StatTile
          label={dict.summary.profit}
          value={formatMoney(totals.profit, locale)}
          tone={profitTone}
          hint={shippedHint}
        />
      </div>
    </>
  )
}

function Figure({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate type-label">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-[17px] font-semibold tracking-[-0.015em] tabular-nums", className)}>
        {children}
      </dd>
    </div>
  )
}
