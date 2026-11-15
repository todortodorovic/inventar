"use client"

import { useApp } from "@/components/app/app-provider"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatPercent, plural } from "@/lib/format"
import { expectedProfit } from "@/lib/inventory/selectors"
import type { Article, Id } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { ArticleCardActions, ArticleMenu, type ArticleAction } from "./article-actions"
import { ArticleIdentity, StockInfo, UnitProfit } from "./article-cells"
import type { Totals } from "./filters"
import { profitText } from "@/components/app/money"

const label = "type-label"

/** Phones and tablets: the table's rows as stacked cards, then a totals card. */
export function ArticleCards({
  rows,
  totals,
  inShipments,
  flash,
  dict,
  onAction,
}: {
  rows: Article[]
  totals: Totals
  inShipments: Map<Id, number>
  flash: Id | null
  dict: Dictionary["inventory"]
  onAction: (action: ArticleAction, article: Article) => void
}) {
  const { t, locale } = useApp()
  const avgMargin = totals.value > 0 ? totals.profit / totals.value : null
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-2" aria-label={dict.table.caption}>
        {rows.map((a) => {
          const expected = expectedProfit(a)
          return (
            <li
              key={a.id}
              className={cn(
                "flex min-w-0 flex-col gap-3.5 rounded-(--radius-card) border border-hairline bg-card p-4 shadow-card transition-colors duration-700",
                flash === a.id && "border-accent-edge/50 bg-accent-soft duration-0",
              )}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <ArticleIdentity article={a} className="flex-1 pt-0.5" />
                  <ArticleMenu article={a} dict={dict} onAction={onAction} size="lg" className="-mt-2 -mr-2 shrink-0" />
                </div>
                <StockInfo
                  article={a}
                  inShipments={inShipments.get(a.id) ?? 0}
                  dict={dict}
                  className="flex-row flex-wrap items-center gap-x-3 gap-y-1"
                />
              </div>
              <dl className="grid grid-cols-3 gap-2 rounded-lg bg-sunken px-3 py-2.5 text-[13.5px] tabular-nums">
                <div className="min-w-0">
                  <dt className={label}>{dict.table.purchase}</dt>
                  <dd className="mt-0.5 truncate text-fg-soft">{formatMoney(a.purchasePrice, locale)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={label}>{dict.table.sale}</dt>
                  <dd className="mt-0.5 truncate font-medium">{formatMoney(a.salePrice, locale)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={label}>{dict.table.unitProfit}</dt>
                  <dd className="mt-0.5">
                    <UnitProfit article={a} dict={dict} />
                  </dd>
                </div>
              </dl>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-fg-muted">{dict.table.expected}</span>
                <span
                  className={cn(
                    "text-[17px] font-semibold tracking-[-0.015em] tabular-nums",
                    profitText(expected, "text-fg-faint"),
                  )}
                >
                  {formatMoney(expected, locale)}
                </span>
              </div>
              <ArticleCardActions article={a} dict={dict} onAction={onAction} />
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-surface-subtle p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-3 border-b border-hairline pb-3">
          <p className="type-heading">{dict.table.totals}</p>
          <p className="text-[12.5px] text-fg-muted">
            {plural(t.units.articles, totals.articles, locale)} · {plural(t.units.pieces, totals.pieces, locale)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 tabular-nums">
          <TotalFigure label={dict.table.totalCost} value={formatMoney(totals.cost, locale)} />
          <TotalFigure label={dict.table.totalValue} value={formatMoney(totals.value, locale)} />
          <TotalFigure label={dict.table.avgMargin} value={avgMargin === null ? "—" : formatPercent(avgMargin, locale)} />
          <TotalFigure
            label={dict.table.expected}
            value={formatMoney(totals.profit, locale)}
            tone={totals.profit > 0 ? "gain" : totals.profit < 0 ? "loss" : undefined}
            strong
          />
        </dl>
      </div>
    </div>
  )
}

function TotalFigure({
  label: text,
  value,
  tone,
  strong,
}: {
  label: string
  value: string
  tone?: "gain" | "loss"
  strong?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate type-label">{text}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate font-semibold",
          strong && "text-[17px] tracking-[-0.015em]",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </dd>
    </div>
  )
}
