"use client"

import { useApp } from "@/components/app/app-provider"
import { statusClass } from "@/components/app/badges"
import { Panel, PanelHeader } from "@/components/app/panel"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatNumber, formatPercent, plural } from "@/lib/format"
import { shipmentStatusOrder, type shipmentPipeline } from "@/lib/inventory/stats"
import { cn } from "@/lib/utils"
import { PanelEmpty, SectionLink } from "./figures"

/**
 * Parcels by status as one thin segmented bar (status colours, 2px gaps),
 * with a row per status underneath carrying the names and figures, so the
 * colour is never the only key.
 */
export function ShipmentPipeline({
  dict,
  pipeline,
}: {
  dict: Dictionary["overview"]["pipeline"]
  pipeline: ReturnType<typeof shipmentPipeline>
}) {
  const { locale, t } = useApp()
  const total = pipeline.total.count
  const parts = shipmentStatusOrder.filter((s) => pipeline[s].count > 0)
  const summary = parts.map((s) => `${t.shipmentStatus[s]} ${formatNumber(pipeline[s].count, locale)}`).join(", ")

  return (
    <Panel className="flex h-full min-w-0 flex-col">
      <PanelHeader
        title={dict.title}
        description={dict.description}
        actions={<SectionLink href={localePath(locale, "shipments")}>{dict.link}</SectionLink>}
      />
      {total === 0 ? (
        <PanelEmpty>{dict.empty}</PanelEmpty>
      ) : (
        <div className="flex flex-col gap-5 px-5 pt-5 pb-6 sm:px-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[34px] leading-none font-bold tracking-[-0.04em]">{formatNumber(total, locale)}</span>
            <span className="text-sm text-ink-muted">
              {dict.total} · {formatMoney(pipeline.total.cod, locale)} {dict.cod}
            </span>
          </div>

          <div role="img" aria-label={`${dict.barLabel}: ${summary}`} className="flex h-2 gap-0.5">
            {parts.map((s) => (
              <span
                key={s}
                title={`${t.shipmentStatus[s]}: ${formatNumber(pipeline[s].count, locale)}`}
                className={cn("h-full rounded-full transition-[flex-grow] duration-500 ease-soft", statusClass[s].dot)}
                style={{ flexGrow: pipeline[s].count, flexBasis: 0, minWidth: 6 }}
              />
            ))}
          </div>

          <ul className="flex flex-col divide-y divide-line">
            {shipmentStatusOrder.map((s) => {
              const row = pipeline[s]
              return (
                <li key={s} className={cn("flex items-center gap-3 py-2.5 text-sm", row.count === 0 && "text-ink-faint")}>
                  <span className={cn("size-2.5 shrink-0 rounded-full", statusClass[s].dot, row.count === 0 && "opacity-35")} aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium">{t.shipmentStatus[s]}</span>
                  <span className="shrink-0 text-ink-muted tabular-nums">
                    {plural(t.units.shipments, row.count, locale)}
                    {row.count > 0 && <span className="hidden sm:inline"> · {formatPercent(row.count / total, locale)}</span>}
                  </span>
                  <span className="w-[108px] shrink-0 text-right font-semibold tabular-nums">{formatMoney(row.cod, locale)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Panel>
  )
}
