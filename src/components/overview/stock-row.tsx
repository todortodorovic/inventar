"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, plural } from "@/lib/format"
import type { openShipmentsSummary, StockSummary } from "@/lib/inventory/stats"
import { compactRow, Money } from "./figures"

/**
 * What the business holds right now: stock at cost, profit waiting on the
 * shelf, shipments not yet delivered, items to restock. The two linked tiles
 * carry a status edge: sky for open shipments; red when something is out of stock,
 * amber when only running low, green when all is stocked.
 */
export function StockRow({
  dict,
  stock,
  open,
}: {
  dict: Dictionary["overview"]
  stock: StockSummary
  open: ReturnType<typeof openShipmentsSummary>
}) {
  const { locale, t } = useApp()
  const s = dict.stock
  const short = stock.low + stock.out
  // One money format across the row on phones.
  const compact = compactRow(stock.cost, stock.expectedProfit, open.cod)
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatTile
        label={s.cost}
        value={<Money amount={stock.cost} locale={locale} compact={compact} />}
        hint={fill(s.costHint, { pieces: plural(t.units.pieces, stock.pieces, locale) })}
      />
      <StatTile
        label={s.expectedProfit}
        tone={stock.expectedProfit > 0 ? "gain" : stock.expectedProfit < 0 ? "loss" : "default"}
        value={<Money amount={stock.expectedProfit} locale={locale} compact={compact} />}
        hint={fill(s.expectedProfitHint, { value: formatMoney(stock.value, locale) })}
      />
      <TileLink href={localePath(locale, "shipments")} label={`${s.shipments}: ${s.open}`}>
        <StatTile
          className="h-full"
          label={`${s.shipments} · ${formatNumber(open.count, locale)}`}
          edge="var(--status-sent)"
          value={<Money amount={open.cod} locale={locale} compact={compact} />}
          hint={fill(s.shipmentsHint, {
            pending: formatNumber(open.byStatus.pending.count, locale),
            sent: formatNumber(open.byStatus.sent.count, locale),
          })}
        />
      </TileLink>
      <TileLink href={localePath(locale, "inventory")} label={`${s.lowStock}: ${s.open}`}>
        <StatTile
          className="h-full"
          label={s.lowStock}
          edge={stock.out > 0 ? "var(--danger)" : stock.low > 0 ? "var(--status-pending)" : "var(--status-delivered)"}
          value={plural(t.units.articles, short, locale)}
          hint={
            short > 0
              ? fill(s.lowStockHint, { out: formatNumber(stock.out, locale), low: formatNumber(stock.low, locale) })
              : s.lowStockNone
          }
        />
      </TileLink>
    </div>
  )
}

/** A whole tile as a link: lifts on hover, graphite outline on keyboard focus. */
function TileLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      title={label}
      className="group/tile block min-w-0 rounded-(--radius-card) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>div]:transition-[border-color,box-shadow] [&>div]:duration-150 [&>div]:group-hover/tile:border-hairline-strong [&>div]:group-hover/tile:shadow-pop"
    >
      {children}
    </Link>
  )
}
