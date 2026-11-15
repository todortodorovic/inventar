"use client"

import { useApp } from "@/components/app/app-provider"
import { Panel, PanelHeader } from "@/components/app/panel"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatNumber, plural } from "@/lib/format"
import type { ArticleProfit } from "@/lib/inventory/stats"
import { cn } from "@/lib/utils"
import { PanelEmpty } from "./figures"

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
        <ol className="flex flex-col px-3 pt-3 pb-4 sm:px-4">
          {rows.map((r, i) => (
            <li key={r.articleId} className="flex items-center gap-3.5 rounded-2xl px-2 py-3 sm:gap-4">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full font-display text-[15px] font-bold tabular-nums",
                  i === 0 ? "bg-ink text-cream shadow-[0_2px_0_0_var(--pop)]" : "bg-sand text-ink-soft",
                )}
              >
                <span className="sr-only">{dict.rank} </span>
                {formatNumber(i + 1, locale)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[15px] font-semibold">{r.name}</span>
                  <span className={cn("shrink-0 font-semibold tabular-nums", r.profit < 0 ? "text-loss" : "text-gain")}>
                    {formatMoney(r.profit, locale)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/5">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (Math.abs(r.profit) / largest) * 100)}%`,
                        background: r.profit < 0 ? "var(--loss)" : "var(--chart-2)",
                      }}
                    />
                  </span>
                  <span className="shrink-0 text-[12px] text-ink-muted tabular-nums">
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
