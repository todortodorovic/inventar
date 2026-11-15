"use client"

import { ArrowDownLeftIcon, ArrowUpRightIcon, HistoryIcon } from "lucide-react"
import { useApp } from "@/components/app/app-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Dictionary } from "@/content/types"
import { fill, formatDateTime, formatMoney, formatNumber, formatSigned, plural } from "@/lib/format"
import { saleProfit } from "@/lib/inventory/selectors"
import type { Article, InventoryState } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | undefined
  state: InventoryState
  dict: Dictionary["inventory"]
}

/** Every stock movement of one article, newest first, with its sales totals. */
export function HistoryDialog({ open, onOpenChange, article, state, dict }: Props) {
  const { t } = useApp()
  return (
    <Dialog open={open && !!article} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-2xl">
        {article && <History article={article} state={state} dict={dict} />}
      </DialogContent>
    </Dialog>
  )
}

function History({ article, state, dict }: { article: Article; state: InventoryState; dict: Dictionary["inventory"] }) {
  const { t, locale } = useApp()

  // Backdated sales can sit after newer movements in the log, so sort by date (log order breaks ties).
  const movements = state.movements
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.articleId === article.id)
    .sort((a, b) => b.m.date.localeCompare(a.m.date) || b.i - a.i)
    .map(({ m }) => m)
  const sales = state.sales.filter((s) => s.articleId === article.id)
  const soldPieces = sales.reduce((sum, s) => sum + s.quantity, 0)
  const earned = sales.reduce((sum, s) => sum + saleProfit(s), 0)
  const codes = new Map(state.shipments.map((sh) => [sh.id, sh.code]))
  const buyers = new Map(sales.map((s) => [s.id, s.buyer]))

  const stats = [
    { label: dict.history.sales, value: formatNumber(sales.length, locale) },
    { label: dict.history.soldPieces, value: formatNumber(soldPieces, locale) },
    {
      label: dict.history.salesProfit,
      value: formatMoney(earned, locale),
      // Money needs the full width on phones.
      className: cn("col-span-2 sm:col-span-1", earned > 0 ? "text-gain" : earned < 0 && "text-loss"),
    },
  ]

  return (
    <>
      <DialogHeader>
        <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-ink-faint uppercase">{dict.history.title}</p>
        <DialogTitle>{article.name}</DialogTitle>
        <DialogDescription>{dict.history.description}</DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={cn("min-w-0 rounded-2xl bg-sand px-3 py-3 sm:px-4", s.className)}>
            <dt className="truncate font-mono text-[10px] font-medium tracking-[0.12em] text-ink-muted uppercase sm:text-[11px]">
              {s.label}
            </dt>
            <dd className="mt-1 truncate font-display text-lg font-bold tracking-[-0.03em] tabular-nums sm:text-xl">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {movements.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
          <HistoryIcon className="size-4" aria-hidden />
          {dict.history.empty}
        </p>
      ) : (
        <div>
          <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">
            {plural(dict.history.movements, movements.length, locale)}
          </p>
          <ol className="flex flex-col divide-y divide-line rounded-2xl border border-line">
            {movements.map((m) => {
              const incoming = m.quantity > 0
              const Icon = incoming ? ArrowDownLeftIcon : ArrowUpRightIcon
              const ref = m.refId && (codes.has(m.refId) ? fill(dict.history.shipment, { code: codes.get(m.refId)! }) : buyers.get(m.refId))
              const detail = [ref, m.note].filter(Boolean).join(" · ")
              return (
                <li key={m.id} className="flex items-center gap-3 px-3.5 py-3 sm:px-4">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      incoming ? "bg-status-delivered-soft text-gain" : "bg-status-returned-soft text-loss",
                    )}
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{t.movement[m.type]}</p>
                    <p className="truncate text-[13px] text-ink-muted">
                      <time dateTime={m.date}>{formatDateTime(m.date, locale)}</time>
                      {detail && ` · ${detail}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("font-display text-lg leading-tight font-bold tabular-nums", incoming ? "text-gain" : "text-loss")}>
                      {formatSigned(m.quantity, locale)}
                    </p>
                    <p className="text-[12px] text-ink-muted tabular-nums">
                      {fill(dict.history.unitPrice, { price: formatMoney(m.unitPrice, locale) })}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </>
  )
}
