"use client"

import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatPercent, plural } from "@/lib/format"
import { saleCost, saleProfit, saleRevenue } from "@/lib/inventory/selectors"
import type { Sale, SaleChannel } from "@/lib/inventory/types"

const channelColor: Record<SaleChannel, string> = {
  direct: "var(--ink)",
  shipment: "var(--status-sent)",
}

/** Headline numbers for the sales currently shown (after every filter). */
export function SalesStats({ sales, dict }: { sales: Sale[]; dict: Dictionary["sales"] }) {
  const { t, locale } = useApp()

  let revenue = 0
  let cost = 0
  let profit = 0
  let pieces = 0
  const byChannel: Record<SaleChannel, number> = { direct: 0, shipment: 0 }
  for (const s of sales) {
    revenue += saleRevenue(s)
    cost += saleCost(s)
    profit += saleProfit(s)
    pieces += s.quantity
    byChannel[s.channel] += saleRevenue(s)
  }
  const margin = revenue > 0 ? profit / revenue : null

  return (
    <section aria-label={dict.stats.label} className="grid grid-cols-2 gap-3 lg:grid-cols-6">
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
                <span role="img" aria-label={dict.stats.split} className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-ink/6">
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
                <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] tracking-[0.06em] uppercase">
                  {(["direct", "shipment"] as const).map((c) => (
                    <span key={c} className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: channelColor[c] }} aria-hidden />
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
        accent="var(--chart-2)"
        value={formatMoney(profit, locale)}
        tone={profit > 0 ? "gain" : profit < 0 ? "loss" : "default"}
        hint={dict.stats.profitHint}
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
