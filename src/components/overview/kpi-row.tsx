"use client"

import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, formatPercent, plural } from "@/lib/format"
import { relativeChange, type MonthPoint, type PeriodKey, type PeriodSummary } from "@/lib/inventory/stats"
import { compactRow, Delta, Money } from "./figures"

/**
 * Revenue, net profit, margin and pieces sold for the period, each against the
 * period before. Sparklines follow the metric's colour: green for net profit
 * (the tile's gain tone), neutral grey for revenue and pieces; the margin, a
 * ratio, has none.
 */
export function KpiRow({
  dict,
  period,
  current,
  previous,
  months = [],
}: {
  dict: Dictionary["overview"]
  period: PeriodKey
  current: PeriodSummary
  /** The equal-length period before; null for "all". */
  previous: PeriodSummary | null
  /** The monthly series, for the sparklines (the last 12 months, whatever the period). */
  months?: MonthPoint[]
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

  const trend = (pick: (p: MonthPoint) => number) => (months.length > 1 ? months.map(pick) : undefined)

  // Revenue and net profit sit side by side on phones: shorten both or neither.
  const compact = compactRow(current.revenue, current.netProfit)

  const shipping =
    current.shippingCosts > 0 ? fill(k.shippingCosts, { amount: formatMoney(current.shippingCosts, locale) }) : k.noShippingCosts

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatTile
        label={k.revenue}
        accent="var(--chart-1)"
        value={<Money amount={current.revenue} locale={locale} compact={compact} />}
        trend={trend((p) => p.revenue)}
        hint={delta((s) => s.revenue) ?? plural(t.units.sales, current.count, locale)}
      />
      <StatTile
        label={k.netProfit}
        accent="var(--chart-2)"
        tone={current.netProfit < 0 ? "loss" : current.netProfit > 0 ? "gain" : "default"}
        value={<Money amount={current.netProfit} locale={locale} compact={compact} />}
        trend={trend((p) => p.profit)}
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
        trend={trend((p) => p.pieces)}
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
