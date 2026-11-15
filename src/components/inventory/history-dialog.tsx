"use client"

import { ArrowDownLeftIcon, ArrowUpRightIcon, HistoryIcon } from "lucide-react"
import { useApp } from "@/components/app/app-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Dictionary } from "@/content/types"
import { fill, formatDateTime, formatMoney, formatNumber, formatSigned, plural } from "@/lib/format"
import { saleProfit } from "@/lib/inventory/selectors"
import type { Article, InventoryState, Movement } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { profitText } from "@/components/app/money"

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
      className: cn("col-span-2 sm:col-span-1", profitText(earned, "")),
    },
  ]

  return (
    <>
      <DialogHeader>
        <p className="type-overline">{dict.history.title}</p>
        <DialogTitle>{article.name}</DialogTitle>
        <DialogDescription>{dict.history.description}</DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={cn("min-w-0 rounded-lg border border-hairline bg-surface-subtle px-3 py-2.5 sm:px-3.5", s.className)}>
            <dt className="truncate type-label">
              {s.label}
            </dt>
            <dd className="mt-1 truncate text-[17px] font-semibold tracking-[-0.01em] tabular-nums sm:text-[19px]">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {movements.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-fg-muted">
          <HistoryIcon className="size-4" aria-hidden />
          {dict.history.empty}
        </p>
      ) : (
        <div>
          <p className="mb-2 type-overline">
            {plural(dict.history.movements, movements.length, locale)}
          </p>
          <ol className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline">
            {movements.map((m) => {
              const tone = movementTone(m)
              const Icon = m.quantity > 0 ? ArrowDownLeftIcon : ArrowUpRightIcon
              const code = m.refId ? codes.get(m.refId) : undefined
              const buyer = m.refId && !code ? buyers.get(m.refId) : undefined
              const detail = [buyer, m.note].filter(Boolean).join(" · ")
              return (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-3.5">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", tone.icon)} aria-hidden>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{t.movement[m.type]}</p>
                    {/* Phones wrap the line (between its parts) so the shipment code is never cut off. */}
                    <p className="text-[12.5px] text-fg-muted tabular-nums sm:truncate">
                      <time dateTime={m.date} className="whitespace-nowrap">
                        {formatDateTime(m.date, locale)}
                      </time>
                      {code && (
                        <>
                          {" · "}
                          <span className="whitespace-nowrap">
                            <ShipmentRef template={dict.history.shipment} code={code} />
                          </span>
                        </>
                      )}
                      {detail && ` · ${detail}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-[15px] leading-tight font-semibold tabular-nums", tone.text)}>
                      {formatSigned(m.quantity, locale)}
                    </p>
                    <p className="text-[12px] text-fg-muted tabular-nums">
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

/**
 * Colour of a movement: stock coming in is green, packing into a shipment is
 * the "sent" sky, a sale is plain ink (it is good news, never a loss), and
 * red is kept for a correction that takes pieces off the shelf.
 */
function movementTone(m: Movement): { icon: string; text: string } {
  if (m.quantity > 0) return { icon: "bg-gain-soft text-gain", text: "text-gain" }
  if (m.type === "shipment") return { icon: "bg-status-sent-soft text-status-sent-ink", text: "text-status-sent-ink" }
  if (m.type === "adjust") return { icon: "bg-loss-soft text-loss", text: "text-loss" }
  return { icon: "bg-sunken text-fg-soft", text: "text-fg" }
}

/** "Pošiljka {code}" with the code set in the monospace, a pixel smaller than the Inter around it. */
function ShipmentRef({ template, code }: { template: string; code: string }) {
  const [before, after = ""] = template.split("{code}")
  return (
    <>
      {before}
      <span className="font-code text-[11.5px] text-fg-soft">{code}</span>
      {after}
    </>
  )
}
