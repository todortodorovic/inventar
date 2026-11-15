"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, plural } from "@/lib/format"
import type { openShipmentsSummary, StockSummary } from "@/lib/inventory/stats"
import { Money } from "./figures"

/** What the business holds right now: stock at cost, profit waiting on the shelf, parcels under way, items to restock. */
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
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label={s.cost}
        value={<Money amount={stock.cost} locale={locale} />}
        hint={fill(s.costHint, { pieces: plural(t.units.pieces, stock.pieces, locale) })}
      />
      <StatTile
        label={s.expectedProfit}
        tone={stock.expectedProfit > 0 ? "gain" : stock.expectedProfit < 0 ? "loss" : "default"}
        value={<Money amount={stock.expectedProfit} locale={locale} />}
        hint={fill(s.expectedProfitHint, { value: formatMoney(stock.value, locale) })}
      />
      <TileLink href={localePath(locale, "shipments")} label={`${s.onTheWay}: ${s.open}`}>
        <StatTile
          className="h-full"
          label={`${s.onTheWay} · ${formatNumber(open.count, locale)}`}
          accent="var(--status-sent)"
          value={<Money amount={open.cod} locale={locale} />}
          hint={fill(s.onTheWayHint, {
            pending: formatNumber(open.byStatus.pending.count, locale),
            sent: formatNumber(open.byStatus.sent.count, locale),
          })}
        />
      </TileLink>
      <TileLink href={localePath(locale, "inventory")} label={`${s.lowStock}: ${s.open}`}>
        <StatTile
          className="h-full"
          label={s.lowStock}
          accent={short > 0 ? "var(--status-pending)" : "var(--status-delivered)"}
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

/** A whole tile as a link: lifts on hover, ring on keyboard focus. */
function TileLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      title={label}
      className="group/tile block min-w-0 rounded-(--radius-card) transition-transform duration-200 ease-soft outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&>div]:transition-shadow [&>div]:group-hover/tile:shadow-[0_18px_36px_-24px_rgb(22_22_26/0.35)]"
    >
      {children}
    </Link>
  )
}
