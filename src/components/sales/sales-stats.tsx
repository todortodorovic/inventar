"use client"

import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatPercent, plural } from "@/lib/format"
import { marginOf, saleRevenue } from "@/lib/inventory/selectors"
import { sumSales } from "@/lib/inventory/stats"
import type { Id, Sale, SaleChannel, Shipment } from "@/lib/inventory/types"

const channelColor: Record<SaleChannel, string> = {
  direct: "var(--chart-3)",
  shipment: "var(--chart-4)",
}

/**
 * Headline numbers for the sales currently shown (after every filter).
 * Profit is net, like Pregled's: the goods' margin minus the postage paid on
 * the delivered parcels whose sales are shown (the same figure the Leglo
 * confirm promises).
 */
export function SalesStats({
  sales,
  shipments,
  dict,
}: {
  sales: Sale[]
  shipments: readonly Shipment[]
  dict: Dictionary["sales"]
}) {
  const { t, locale } = useApp()

  const { revenue, cost, grossProfit, pieces } = sumSales(sales)
  const byChannel: Record<SaleChannel, number> = { direct: 0, shipment: 0 }
  const parcels = new Set<Id>()
  for (const s of sales) {
    byChannel[s.channel] += saleRevenue(s)
    if (s.shipmentId) parcels.add(s.shipmentId)
  }
  let postage = 0
  for (const sh of shipments) if (sh.status === "delivered" && parcels.has(sh.id)) postage += sh.shippingCost
  const profit = grossProfit - postage
  const margin = marginOf(revenue, revenue - profit)
  // Profit keeps one colour everywhere: green for gain, red for loss.
  const profitColor = profit < 0 ? "var(--loss)" : "var(--chart-2)"

  return (
    <section aria-label={dict.stats.label} className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:gap-4">
      <StatTile
        className="col-span-2"
        label={t.fields.revenue}
        accent="var(--chart-1)"
        value={formatMoney(revenue, locale)}
        hint={
          <span className="flex flex-col gap-2.5">
            <span>{dict.stats.revenueHint}</span>
            {revenue > 0 && (
              <span className="flex flex-col gap-1.5">
                <span role="img" aria-label={dict.stats.split} className="flex h-1.5 gap-[3px] overflow-hidden rounded-full bg-sunken-strong/70">
                  {(["direct", "shipment"] as const).map(
                    (c) =>
                      byChannel[c] > 0 && (
                        <span
                          key={c}
                          className="h-full rounded-full transition-[width] duration-500 ease-soft"
                          style={{ width: `${(byChannel[c] / revenue) * 100}%`, background: channelColor[c] }}
                        />
                      ),
                  )}
                </span>
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-fg-muted">
                  {(["direct", "shipment"] as const).map((c) => (
                    <span key={c} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px]" style={{ background: channelColor[c] }} aria-hidden />
                      {t.saleChannel[c]} {formatPercent(byChannel[c] / revenue, locale)}
                    </span>
                  ))}
                </span>
              </span>
            )}
          </span>
        }
      />
      <StatTile label={t.fields.cost} value={formatMoney(cost, locale)} hint={dict.stats.costHint} />
      <StatTile
        label={t.fields.profit}
        accent={profitColor}
        value={formatMoney(profit, locale)}
        tone={profit > 0 ? "gain" : profit < 0 ? "loss" : "default"}
        hint={postage > 0 ? fill(dict.stats.postageHint, { amount: formatMoney(postage, locale) }) : dict.stats.profitHint}
      />
      <StatTile
        label={t.fields.margin}
        value={margin === null ? dict.stats.marginNone : formatPercent(margin, locale)}
        tone={margin !== null && margin < 0 ? "loss" : "default"}
        hint={dict.stats.marginHint}
      />
      <StatTile
        label={dict.stats.sold}
        value={plural(t.units.pieces, pieces, locale)}
        hint={plural(t.units.sales, sales.length, locale)}
      />
    </section>
  )
}
