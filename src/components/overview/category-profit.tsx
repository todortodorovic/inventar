"use client"

import { useApp } from "@/components/app/app-provider"
import { Panel, PanelHeader } from "@/components/app/panel"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatPercent, plural } from "@/lib/format"
import type { CategoryProfit as Row } from "@/lib/inventory/stats"
import { cn } from "@/lib/utils"
import { PanelEmpty } from "./figures"
import { profitText } from "@/components/app/money"

/**
 * Ranked horizontal bars in the profit green (red for a loss), largest first.
 * The name, amount and share are printed beside each bar, so the bar only
 * has to show proportion.
 */
export function CategoryProfit({ dict, rows }: { dict: Dictionary["overview"]["categories"]; rows: Row[] }) {
  const { locale, t } = useApp()
  const largest = Math.max(1, ...rows.map((r) => Math.abs(r.profit)))
  const total = rows.reduce((sum, r) => sum + Math.max(0, r.profit), 0)
  return (
    <Panel className="flex h-full min-w-0 flex-col">
      <PanelHeader title={dict.title} description={dict.description} />
      {rows.length === 0 ? (
        <PanelEmpty>{dict.empty}</PanelEmpty>
      ) : (
        <ul className="flex flex-col gap-3.5 px-4 pt-4 pb-5 sm:px-5">
          {rows.map((r) => {
            const share = r.profit > 0 && total > 0 ? r.profit / total : null
            return (
              <li key={r.category} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                  <span className="min-w-0 truncate font-medium">{r.category || dict.uncategorized}</span>
                  <span className={cn("shrink-0 font-semibold tabular-nums", profitText(r.profit))}>
                    {formatMoney(r.profit, locale)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-sunken-strong/70">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500 ease-soft motion-reduce:transition-none",
                      r.profit < 0 ? "bg-loss" : "bg-gain",
                    )}
                    style={{ width: `${Math.max(2, (Math.abs(r.profit) / largest) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between gap-3 text-[12px] text-fg-muted tabular-nums">
                  <span>{plural(t.units.pieces, r.pieces, locale)}</span>
                  {share !== null && <span>{fill(dict.share, { share: formatPercent(share, locale) })}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
