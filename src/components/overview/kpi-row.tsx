"use client"

import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, formatPercent, plural } from "@/lib/format"
import { relativeChange, type PeriodKey, type PeriodSummary } from "@/lib/inventory/stats"
import { Delta, Money } from "./figures"

/** Revenue, net profit, margin and pieces sold for the period, each against the period before. */
export function KpiRow({
  dict,
  period,
  current,
  previous,
}: {
  dict: Dictionary["overview"]
  period: PeriodKey
  current: PeriodSummary
  /** The equal-length period before; null for "all". */
  previous: PeriodSummary | null
}) {
  const { locale, t } = useApp()
  const k = dict.kpi

  // No comparison line at all for "all": there is no period before it.
  function delta(pick: (s: PeriodSummary) => number) {
    if (period === "all" || !previous) return null
    const change = relativeChange(pick(current), pick(previous))
    return <Delta change={change} against={dict.vsPrevious[period]} dict={dict.delta} locale={locale} />
  }

  function marginDelta() {
    if (period === "all" || !previous) return null
    const change = current.margin !== null && previous.margin !== null ? current.margin - previous.margin : null
    return <Delta change={change} points against={dict.vsPrevious[period]} dict={dict.delta} locale={locale} />
  }

  const shipping =
    current.shippingCosts > 0 ? fill(k.shippingCosts, { amount: formatMoney(current.shippingCosts, locale) }) : k.noShippingCosts

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label={k.revenue}
        accent="var(--chart-1)"
        value={<Money amount={current.revenue} locale={locale} />}
        hint={delta((s) => s.revenue) ?? plural(t.units.sales, current.count, locale)}
      />
      <StatTile
        label={k.netProfit}
        accent="var(--chart-2)"
        tone={current.netProfit < 0 ? "loss" : current.netProfit > 0 ? "gain" : "default"}
        value={<Money amount={current.netProfit} locale={locale} />}
        hint={
          <span className="flex flex-col gap-1">
            {delta((s) => s.netProfit)}
            <span>{shipping}</span>
          </span>
        }
      />
      <StatTile
        label={k.margin}
        value={current.margin === null ? "—" : formatPercent(current.margin, locale)}
        hint={marginDelta() ?? k.marginHint}
      />
      <StatTile
        label={k.pieces}
        value={formatNumber(current.pieces, locale)}
        hint={
          <span className="flex flex-col gap-1">
            {delta((s) => s.pieces)}
            <span>{plural(t.units.sales, current.count, locale)}</span>
          </span>
        }
      />
    </div>
  )
}
