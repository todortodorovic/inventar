"use client"

import { InfoIcon } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { Panel, PanelHeader } from "@/components/app/panel"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, formatSigned, plural } from "@/lib/format"
import { saleProfit, saleRevenue } from "@/lib/inventory/selectors"
import type { Id, Sale } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { dayKey, formatDay } from "./period"
import { SaleRow, saleColumns } from "./sale-row"

/** Rows rendered at first and per "Prikaži još": enough to fill a few screens. */
const PAGE = 50

type Day = { key: string; date: string; sales: Sale[] }

/** The day's profit subtotal is a soft chip, so it reads apart from the rows' own profit. */
const dayProfitTone = (n: number) =>
  n > 0 ? "bg-gain-soft text-gain" : n < 0 ? "bg-loss-soft text-loss" : "bg-sunken-strong text-fg-muted"

/**
 * Sales grouped by the seller's calendar day, newest first, with each day's
 * totals in a header that sticks under the app header while scrolling.
 * Remount it (via `key`) when the filters change, to start from the top.
 */
export function SaleList({
  sales,
  shipmentCodes,
  now,
  highlightId,
  dict,
  onUndo,
}: {
  /** Newest first. */
  sales: Sale[]
  shipmentCodes: Map<Id, string>
  now: Date
  highlightId: Id | null
  dict: Dictionary["sales"]["list"]
  onUndo: (sale: Sale) => void
}) {
  const { t, locale } = useApp()
  const [limit, setLimit] = useState(PAGE)

  // Day totals cover the whole day, even when only part of it is rendered yet.
  const totals = new Map<string, { revenue: number; profit: number; count: number }>()
  for (const s of sales) {
    const key = dayKey(s.date)
    const day = totals.get(key) ?? { revenue: 0, profit: 0, count: 0 }
    day.revenue += saleRevenue(s)
    day.profit += saleProfit(s)
    day.count++
    totals.set(key, day)
  }

  const days: Day[] = []
  for (const s of sales.slice(0, limit)) {
    const key = dayKey(s.date)
    const last = days.at(-1)
    if (last?.key === key) last.sales.push(s)
    else days.push({ key, date: s.date, sales: [s] })
  }

  const todayKey = dayKey(now.toISOString())
  const yesterdayKey = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString())
  const dayLabel = (day: Day) => {
    if (day.key === todayKey) return dict.today
    if (day.key === yesterdayKey) return dict.yesterday
    const text = formatDay(day.date, locale, now)
    return text.charAt(0).toLocaleUpperCase(siteConfig.localeTags[locale]) + text.slice(1)
  }

  const shown = Math.min(limit, sales.length)
  const hasShipmentSales = sales.some((s) => s.channel === "shipment")

  return (
    // `overflow-clip` rounds the last row's hover without breaking the sticky day headers.
    <Panel className="overflow-clip">
      <PanelHeader title={dict.title} description={dict.description} className="pb-3.5" />

      <div
        aria-hidden
        className={cn(
          "hidden h-9 items-center gap-3 border-t border-hairline bg-surface-subtle px-5 type-label md:grid xl:gap-4",
          saleColumns,
        )}
      >
        <span>{dict.columns.time}</span>
        <span>{dict.columns.article}</span>
        <span className="hidden lg:block">{dict.columns.channel}</span>
        <span className="hidden lg:block">{dict.columns.buyer}</span>
        <span className="text-right">{dict.columns.quantity}</span>
        <span className="text-right">{dict.columns.revenue}</span>
        <span className="text-right">{dict.columns.profit}</span>
        <span />
      </div>

      <ol>
        {days.map((day) => {
          const total = totals.get(day.key)!
          return (
            <li key={day.key}>
              {/* Day header: a cool-grey band that sticks under the top bar; on wider
                  screens its subtotals sit in the revenue and profit columns. */}
              <div
                className={cn(
                  "sticky top-(--topbar-h) z-10 flex min-h-10 items-center justify-between gap-3 border-y border-hairline bg-sunken/95 px-4 py-2 backdrop-blur-md sm:px-5 md:grid md:py-1.5 lg:top-0 xl:gap-4",
                  saleColumns,
                )}
              >
                <h3 className="flex min-w-0 items-baseline gap-2 md:col-span-3 lg:col-span-5">
                  <span className="truncate text-[13px] font-semibold text-fg">{dayLabel(day)}</span>
                  {/* Phones: the date needs the width; the rows below show the count. */}
                  <span className="shrink-0 text-[12px] text-fg-muted tabular-nums max-sm:hidden">
                    {plural(t.units.sales, total.count, locale)}
                  </span>
                </h3>
                <p className="flex shrink-0 items-center gap-2 text-[13px] font-semibold tabular-nums md:contents">
                  <span className="md:text-right">
                    <span className="sr-only">{t.fields.revenue}: </span>
                    {formatMoney(total.revenue, locale)}
                  </span>
                  <span className="md:flex md:justify-end">
                    <span className={cn("inline-flex h-[22px] items-center rounded-[6px] px-1.5 md:-mr-1.5", dayProfitTone(total.profit))}>
                      <span className="sr-only">{t.fields.profit}: </span>
                      {formatSigned(total.profit, locale)}
                    </span>
                  </span>
                </p>
              </div>
              <ul>
                {day.sales.map((s) => (
                  <SaleRow
                    key={s.id}
                    sale={s}
                    shipmentCode={s.shipmentId ? shipmentCodes.get(s.shipmentId) : undefined}
                    highlighted={s.id === highlightId}
                    dict={dict}
                    onUndo={onUndo}
                  />
                ))}
              </ul>
            </li>
          )
        })}
      </ol>

      {(shown < sales.length || hasShipmentSales) && (
        <div className="flex flex-col items-center gap-4 border-t border-hairline px-4 py-5 sm:px-5">
          {shown < sales.length && (
            <div className="flex flex-col items-center gap-2.5">
              <p className="text-[12.5px] text-fg-muted" aria-live="polite">
                {fill(dict.shown, { shown: formatNumber(shown, locale), total: formatNumber(sales.length, locale) })}
              </p>
              <Button variant="outline" size="cta" onClick={() => setLimit(limit + PAGE)}>
                {dict.showMore}
              </Button>
            </div>
          )}
          {hasShipmentSales && (
            <p className="flex max-w-xl items-start gap-2 self-start text-[12.5px] text-fg-muted">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-fg-faint" aria-hidden />
              {dict.shipmentHint}
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}
