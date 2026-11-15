"use client"

import { useApp } from "@/components/app/app-provider"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatPercent, plural } from "@/lib/format"
import { expectedProfit } from "@/lib/inventory/selectors"
import type { Article, Id } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { ArticleActions, type ArticleAction } from "./article-actions"
import { ArticleIdentity, StockInfo, UnitProfit } from "./article-cells"
import type { Totals } from "./filters"

const head = "h-11 px-3 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase first:pl-6 last:pr-6"
const cell = "px-3 py-3.5 first:pl-6 last:pr-6"
const num = "text-right tabular-nums"

/** Desktop list: one row per article and a totals row for what is shown. */
export function ArticleTable({
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
    <Table className="min-w-[940px]">
      <caption className="sr-only">{dict.table.caption}</caption>
      <TableHeader>
        <TableRow className="border-line hover:bg-transparent">
          <TableHead className={head}>{dict.table.article}</TableHead>
          <TableHead className={head}>{dict.table.stock}</TableHead>
          <TableHead className={cn(head, "text-right")}>{dict.table.purchase}</TableHead>
          <TableHead className={cn(head, "text-right")}>{dict.table.sale}</TableHead>
          <TableHead className={cn(head, "text-right")}>{dict.table.unitProfit}</TableHead>
          <TableHead className={cn(head, "text-right")}>{dict.table.expected}</TableHead>
          <TableHead className={cn(head, "text-right")}>
            <span className="sr-only">{dict.table.actions}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a) => {
          const expected = expectedProfit(a)
          return (
            <TableRow
              key={a.id}
              className={cn(
                "border-line transition-colors duration-700 hover:bg-cream/70",
                flash === a.id && "bg-highlight/25 duration-0 hover:bg-highlight/25",
              )}
            >
              <TableCell className={cn(cell, "min-w-[220px] whitespace-normal")}>
                <ArticleIdentity article={a} />
              </TableCell>
              <TableCell className={cell}>
                <StockInfo article={a} inShipments={inShipments.get(a.id) ?? 0} dict={dict} />
              </TableCell>
              <TableCell className={cn(cell, num, "text-ink-soft")}>{formatMoney(a.purchasePrice, locale)}</TableCell>
              <TableCell className={cn(cell, num, "font-medium")}>{formatMoney(a.salePrice, locale)}</TableCell>
              <TableCell className={cn(cell, num)}>
                <UnitProfit article={a} dict={dict} className="items-end" />
              </TableCell>
              <TableCell
                className={cn(
                  cell,
                  num,
                  "font-display text-base font-bold tracking-[-0.02em]",
                  expected > 0 ? "text-gain" : expected < 0 ? "text-loss" : "text-ink-faint",
                )}
              >
                {formatMoney(expected, locale)}
              </TableCell>
              <TableCell className={cell}>
                <ArticleActions article={a} dict={dict} onAction={onAction} layout="row" />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
      <TableFooter className="border-line bg-sand/70">
        <TableRow className="hover:bg-transparent">
          <TableCell className={cn(cell, "py-4")}>
            <p className="font-display text-[15px] font-bold">{dict.table.totals}</p>
            <p className="text-[13px] text-ink-muted">{plural(t.units.articles, totals.articles, locale)}</p>
          </TableCell>
          <TableCell className={cn(cell, "py-4 font-semibold tabular-nums")}>
            {plural(t.units.pieces, totals.pieces, locale)}
          </TableCell>
          <FooterFigure label={dict.table.totalCost} value={formatMoney(totals.cost, locale)} />
          <FooterFigure label={dict.table.totalValue} value={formatMoney(totals.value, locale)} />
          <FooterFigure
            label={dict.table.avgMargin}
            value={avgMargin === null ? "—" : formatPercent(avgMargin, locale)}
          />
          <TableCell
            className={cn(
              cell,
              num,
              "py-4 font-display text-lg font-bold tracking-[-0.02em]",
              totals.profit > 0 ? "text-gain" : totals.profit < 0 && "text-loss",
            )}
          >
            {formatMoney(totals.profit, locale)}
          </TableCell>
          <TableCell className={cell} />
        </TableRow>
      </TableFooter>
    </Table>
  )
}

function FooterFigure({ label, value }: { label: string; value: string }) {
  return (
    <TableCell className={cn(cell, num, "py-4")}>
      <p className="font-semibold">{value}</p>
      <p className="text-[12px] font-normal text-ink-muted">{label}</p>
    </TableCell>
  )
}
