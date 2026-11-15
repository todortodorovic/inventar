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
      <PanelHeader title={dict.title} description={dict.description} className="pb-4" />

      <div
        aria-hidden
        className={cn(
          "hidden items-center gap-3 border-t border-line px-6 py-2.5 font-mono text-[11px] font-medium tracking-[0.12em] text-ink-faint uppercase md:grid xl:gap-4",
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
              <div className="sticky top-[72px] z-10 flex items-center justify-between gap-3 border-y border-line bg-sand/90 px-5 py-2 backdrop-blur-md sm:px-6">
                <h3 className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
                    {dayLabel(day)}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tracking-[0.08em] text-ink-faint uppercase">
                    {plural(t.units.sales, total.count, locale)}
                  </span>
                </h3>
                <p className="flex shrink-0 items-baseline gap-3 text-[13px] tabular-nums">
                  <span className="font-semibold">
                    <span className="sr-only">{t.fields.revenue}: </span>
                    {formatMoney(total.revenue, locale)}
                  </span>
                  <span
                    className={cn(
                      "font-semibold",
                      total.profit > 0 ? "text-gain" : total.profit < 0 ? "text-loss" : "text-ink-muted",
                    )}
                  >
                    <span className="sr-only">{t.fields.profit}: </span>
                    {formatSigned(total.profit, locale)}
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
        <div className="flex flex-col items-center gap-4 border-t border-line px-5 py-5 sm:px-6">
          {shown < sales.length && (
            <div className="flex flex-col items-center gap-2.5">
              <p className="font-mono text-[11px] tracking-[0.1em] text-ink-faint uppercase" aria-live="polite">
                {fill(dict.shown, { shown: formatNumber(shown, locale), total: formatNumber(sales.length, locale) })}
              </p>
              <Button variant="outline" size="cta" className="rounded-full" onClick={() => setLimit(limit + PAGE)}>
                {dict.showMore}
              </Button>
            </div>
          )}
          {hasShipmentSales && (
            <p className="flex max-w-xl items-start gap-2 self-start text-[13px] text-ink-muted">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
              {dict.shipmentHint}
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}
