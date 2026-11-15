"use client"

import { useApp } from "@/components/app/app-provider"
import { Panel, PanelHeader } from "@/components/app/panel"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatNumber, plural } from "@/lib/format"
import type { ArticleProfit } from "@/lib/inventory/stats"
import { cn } from "@/lib/utils"
import { PanelEmpty } from "./figures"
import { profitText } from "@/components/app/money"

/** The period's five best earners: rank, name, pieces, profit and a thin bar against the leader. */
export function TopArticles({ dict, rows }: { dict: Dictionary["overview"]["top"]; rows: ArticleProfit[] }) {
  const { locale, t } = useApp()
  const largest = Math.max(1, ...rows.map((r) => Math.abs(r.profit)))
  return (
    <Panel className="flex h-full min-w-0 flex-col">
      <PanelHeader title={dict.title} description={dict.description} />
      {rows.length === 0 ? (
        <PanelEmpty>{dict.empty}</PanelEmpty>
      ) : (
        <ol className="flex flex-col divide-y divide-hairline px-4 pt-2 pb-3 sm:px-5">
          {rows.map((r, i) => (
            <li key={r.articleId} className="flex items-center gap-3 py-3 sm:gap-3.5">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-md text-[12.5px] font-semibold tabular-nums",
                  i === 0 ? "bg-graphite-900 text-fg-inverse" : "bg-sunken text-fg-muted ring-1 ring-hairline ring-inset",
                )}
              >
                <span className="sr-only">{dict.rank} </span>
                {formatNumber(i + 1, locale)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13.5px] font-medium">{r.name}</span>
                  <span className={cn("shrink-0 font-semibold tabular-nums", profitText(r.profit))}>
                    {formatMoney(r.profit, locale)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-sunken-strong/70">
                    <span
                      className={cn("block h-full rounded-full", r.profit < 0 ? "bg-loss" : "bg-gain")}
                      style={{ width: `${Math.max(2, (Math.abs(r.profit) / largest) * 100)}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-[12px] text-fg-muted tabular-nums">
                    {[r.category, plural(t.units.pieces, r.pieces, locale)].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
