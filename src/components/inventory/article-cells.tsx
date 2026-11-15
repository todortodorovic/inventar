"use client"

import { TruckIcon } from "lucide-react"
import { useApp } from "@/components/app/app-provider"
import { StockBadge } from "@/components/app/badges"
import type { Dictionary } from "@/content/types"
import { fill, formatPercent, formatSigned } from "@/lib/format"
import { marginOf, stockLevel, unitProfit } from "@/lib/inventory/selectors"
import type { Article } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

/** Pieces that show up in the table and the phone cards alike. */

export function ArticleIdentity({ article, className }: { article: Article; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[15px] leading-snug font-semibold text-pretty">{article.name}</p>
      <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
        {article.sku && (
          <span className="rounded-md bg-ink/5 px-1.5 py-px font-mono text-[11px] tracking-[0.06em] text-ink-soft uppercase">
            {article.sku}
          </span>
        )}
        {article.category && <span className="truncate">{article.category}</span>}
      </p>
    </div>
  )
}

export function StockInfo({
  article,
  inShipments,
  dict,
  className,
}: {
  article: Article
  inShipments: number
  dict: Dictionary["inventory"]
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-display text-xl leading-none font-bold tracking-[-0.03em] tabular-nums",
            article.quantity === 0 && "text-ink-faint",
          )}
        >
          {article.quantity}
        </span>
        <StockBadge level={stockLevel(article)} />
      </div>
      {inShipments > 0 && (
        <span className="flex items-center gap-1 text-[12px] font-medium text-[oklch(0.42_0.13_250)]">
          <TruckIcon className="size-3.5" aria-hidden />
          {fill(dict.table.inShipments, { n: inShipments })}
        </span>
      )}
    </div>
  )
}

/** Profit on one piece, with the margin under it. */
export function UnitProfit({ article, dict, className }: { article: Article; dict: Dictionary["inventory"]; className?: string }) {
  const { locale } = useApp()
  const unit = unitProfit(article)
  const margin = marginOf(article.salePrice, article.purchasePrice)
  return (
    <div className={cn("flex flex-col tabular-nums", className)}>
      <span className={cn("font-semibold", unit > 0 ? "text-gain" : unit < 0 ? "text-loss" : "text-ink-muted")}>
        {formatSigned(unit, locale)}
      </span>
      {margin !== null && (
        <span className="text-[12px] text-ink-muted">
          {fill(dict.table.marginOf, { margin: formatPercent(margin, locale) })}
        </span>
      )}
    </div>
  )
}
