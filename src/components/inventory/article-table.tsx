"use client"

import { useApp } from "@/components/app/app-provider"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatPercent, plural } from "@/lib/format"
import { expectedProfit } from "@/lib/inventory/selectors"
import type { Article, Id } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { ArticleRowActions, type ArticleAction } from "./article-actions"
import { ArticleIdentity, StockInfo, UnitProfit } from "./article-cells"
import type { Totals } from "./filters"
import { profitText } from "@/components/app/money"

const head = "sticky top-0 z-10 h-10 bg-surface-subtle/95 px-3 backdrop-blur-sm first:pl-5 last:pr-4"
const cell = "px-3 py-3 first:pl-5 last:pr-4"
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
    <Table className="min-w-[920px]" containerClassName="overflow-x-clip">
      <caption className="sr-only">{dict.table.caption}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(head, "w-[30%]")}>{dict.table.article}</TableHead>
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
                "duration-700",
                flash === a.id && "bg-accent-soft duration-0 hover:bg-accent-soft [&>td:first-child]:shadow-[inset_3px_0_0_var(--accent-edge)]",
              )}
            >
              <TableCell className={cn(cell, "min-w-[260px] whitespace-normal")}>
                <ArticleIdentity article={a} />
              </TableCell>
              <TableCell className={cell}>
                <StockInfo article={a} inShipments={inShipments.get(a.id) ?? 0} dict={dict} />
              </TableCell>
              <TableCell className={cn(cell, num, "text-fg-muted")}>{formatMoney(a.purchasePrice, locale)}</TableCell>
              <TableCell className={cn(cell, num, "font-medium")}>{formatMoney(a.salePrice, locale)}</TableCell>
              <TableCell className={cn(cell, num)}>
                <UnitProfit article={a} dict={dict} className="items-end" />
              </TableCell>
              <TableCell
                className={cn(
                  cell,
                  num,
                  "text-[14px] font-semibold tracking-[-0.01em]",
                  profitText(expected, "text-fg-faint"),
                )}
              >
                {formatMoney(expected, locale)}
              </TableCell>
              <TableCell className={cell}>
                <ArticleRowActions article={a} dict={dict} onAction={onAction} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
      <TableFooter>
        <TableRow className="hover:bg-transparent">
          <TableCell className={cn(cell, "py-4")}>
            <p className="font-semibold">{dict.table.totals}</p>
            <p className="text-[12px] font-normal text-fg-muted">{plural(t.units.articles, totals.articles, locale)}</p>
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
              "py-4 text-[15px] font-semibold tracking-[-0.01em]",
              profitText(totals.profit, ""),
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
      <p className="font-semibold tabular-nums">{value}</p>
      <p className="text-[12px] font-normal text-fg-muted">{label}</p>
    </TableCell>
  )
}
