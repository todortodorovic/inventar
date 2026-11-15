"use client"

import { useApp } from "@/components/app/app-provider"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatPercent, plural } from "@/lib/format"
import { expectedProfit } from "@/lib/inventory/selectors"
import type { Article, Id } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { ArticleActions, type ArticleAction } from "./article-actions"
import { ArticleIdentity, StockInfo, UnitProfit } from "./article-cells"
import type { Totals } from "./filters"

const label = "font-mono text-[10px] font-medium tracking-[0.14em] text-ink-muted uppercase"

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
                "flex min-w-0 flex-col gap-4 rounded-(--radius-card) border border-line bg-card p-4 transition-colors duration-700",
                flash === a.id && "bg-[color-mix(in_oklch,var(--highlight)_22%,white)] duration-0",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <ArticleIdentity article={a} />
                <StockInfo article={a} inShipments={inShipments.get(a.id) ?? 0} dict={dict} className="shrink-0 items-end" />
              </div>
              <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-sand px-3 py-2.5 text-[14px] tabular-nums">
                <div className="min-w-0">
                  <dt className={label}>{dict.table.purchase}</dt>
                  <dd className="truncate text-ink-soft">{formatMoney(a.purchasePrice, locale)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={label}>{dict.table.sale}</dt>
                  <dd className="truncate font-medium">{formatMoney(a.salePrice, locale)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={label}>{dict.table.unitProfit}</dt>
                  <dd>
                    <UnitProfit article={a} dict={dict} />
                  </dd>
                </div>
              </dl>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-ink-soft">{dict.table.expected}</span>
                <span
                  className={cn(
                    "font-display text-lg font-bold tracking-[-0.02em] tabular-nums",
                    expected > 0 ? "text-gain" : expected < 0 ? "text-loss" : "text-ink-faint",
                  )}
                >
                  {formatMoney(expected, locale)}
                </span>
              </div>
              <ArticleActions article={a} dict={dict} onAction={onAction} layout="card" />
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 rounded-(--radius-card) bg-ink p-4 text-cream">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-[17px] font-bold">{dict.table.totals}</p>
          <p className="text-[13px] text-night-muted">
            {plural(t.units.articles, totals.articles, locale)} · {plural(t.units.pieces, totals.pieces, locale)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 tabular-nums">
          <TotalFigure label={dict.table.totalCost} value={formatMoney(totals.cost, locale)} />
          <TotalFigure label={dict.table.totalValue} value={formatMoney(totals.value, locale)} />
          <TotalFigure label={dict.table.avgMargin} value={avgMargin === null ? "—" : formatPercent(avgMargin, locale)} />
          <TotalFigure label={dict.table.expected} value={formatMoney(totals.profit, locale)} highlight />
        </dl>
      </div>
    </div>
  )
}

function TotalFigure({ label: text, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="truncate font-mono text-[10px] font-medium tracking-[0.14em] text-night-faint uppercase">{text}</dt>
      <dd className={cn("truncate font-semibold", highlight && "font-display text-lg font-bold text-check")}>{value}</dd>
    </div>
  )
}
