"use client"

import { PackageCheckIcon, PackageIcon, ReceiptTextIcon, TruckIcon, Undo2Icon, type LucideIcon } from "lucide-react"
import { useApp } from "@/components/app/app-provider"
import { statusClass } from "@/components/app/badges"
import { Panel, PanelHeader } from "@/components/app/panel"
import type { Dictionary } from "@/content/types"
import { fill, formatDateTime, formatMoney, formatRelativeDays } from "@/lib/format"
import { saleProfit, saleRevenue, shipmentTotal } from "@/lib/inventory/selectors"
import type { ActivityEvent } from "@/lib/inventory/stats"
import type { ShipmentStatus } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { PanelEmpty } from "./figures"
import { profitText } from "@/components/app/money"

const shipmentIcon: Record<ShipmentStatus, LucideIcon> = {
  pending: PackageIcon,
  sent: TruckIcon,
  delivered: PackageCheckIcon,
  returned: Undo2Icon,
}

/** Fills `{code}` in a template with the shipment code set in the code face (1px smaller beside Inter). */
function withCode(template: string, code: string) {
  const [before, ...after] = template.split("{code}")
  if (after.length === 0) return template
  return (
    <>
      {before}
      <span className="font-code text-[12.5px]">{code}</span>
      {after.join(code)}
    </>
  )
}

/** The latest sales and parcel status changes, newest first, as a timeline. */
export function RecentActivity({
  dict,
  events,
  now,
}: {
  dict: Dictionary["overview"]["activity"]
  events: ActivityEvent[]
  now: Date
}) {
  const { locale, t } = useApp()
  return (
    <Panel className="flex h-full min-w-0 flex-col">
      <PanelHeader title={dict.title} description={dict.description} />
      {events.length === 0 ? (
        <PanelEmpty>{dict.empty}</PanelEmpty>
      ) : (
        <ol className="flex flex-col px-4 pt-4 pb-4 sm:px-5">
          {events.map((e, i) => {
            const Icon = e.kind === "sale" ? ReceiptTextIcon : shipmentIcon[e.status]
            const title = e.kind === "sale" ? fill(dict.sale, { name: e.sale.articleName }) : withCode(dict.shipment[e.status], e.shipment.code)
            const who = e.kind === "sale" ? e.sale.buyer || dict.walkIn : e.shipment.recipient.name
            const amount = e.kind === "sale" ? saleRevenue(e.sale) : shipmentTotal(e.shipment)
            return (
              <li key={e.key} className="relative flex gap-3 pb-4 last:pb-0">
                {/* The timeline's thread, from this dot down to the next. */}
                {i < events.length - 1 && <span className="absolute top-8 bottom-0 left-[13.5px] w-px bg-hairline" aria-hidden />}
                <span
                  className={cn(
                    "relative grid size-7 shrink-0 place-items-center rounded-md ring-1 ring-inset",
                    e.kind === "sale" ? "bg-gain-soft text-gain ring-gain/15" : cn(statusClass[e.status].chip, "ring-fg/5"),
                  )}
                  aria-hidden
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[13.5px] font-medium">{title}</span>
                    <span
                      className={cn(
                        "shrink-0 text-[13.5px] font-semibold tabular-nums",
                        e.kind === "shipment" && e.status === "returned" && "text-fg-faint line-through",
                      )}
                    >
                      {formatMoney(amount, locale)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-[12.5px] text-fg-muted">
                    <span className="min-w-0 truncate">
                      {who} ·{" "}
                      <time dateTime={e.date} title={formatDateTime(e.date, locale)}>
                        {formatRelativeDays(e.date, locale, now)}
                      </time>
                    </span>
                    {e.kind === "sale" ? (
                      <span className={cn("shrink-0 tabular-nums", profitText(saleProfit(e.sale)))}>
                        {t.fields.profit} {formatMoney(saleProfit(e.sale), locale)}
                      </span>
                    ) : (
                      <span className="shrink-0">{t.shipmentStatus[e.status]}</span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
