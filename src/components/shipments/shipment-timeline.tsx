"use client"

import { useApp } from "@/components/app/app-provider"
import { statusClass } from "@/components/app/badges"
import type { Dictionary } from "@/content/types"
import { formatDateTime } from "@/lib/format"
import type { Shipment } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

type Step = { label: string; date?: string; skipped?: boolean }

/** A soft halo around the current step's dot, in the status colour. */
const halo = {
  pending: "ring-status-pending/25",
  sent: "ring-status-sent/25",
  delivered: "ring-status-delivered/25",
  returned: "ring-status-returned/25",
} as const

/**
 * Packed → sent → delivered/returned, with the date each step happened.
 * Steps behind are graphite; the current one wears the status colour.
 */
export function ShipmentTimeline({ shipment, dict }: { shipment: Shipment; dict: Dictionary["shipments"]["timeline"] }) {
  const { locale } = useApp()
  const returned = shipment.status === "returned"
  const steps: Step[] = [
    { label: dict.created, date: shipment.createdAt },
    // A parcel cancelled before it went out never had a "sent" step.
    { label: dict.sent, date: shipment.sentAt, skipped: returned && !shipment.sentAt },
    returned
      ? { label: dict.returned, date: shipment.returnedAt }
      : { label: dict.delivered, date: shipment.deliveredAt },
  ]
  const current = steps.findLastIndex((step) => step.date)

  return (
    <ol aria-label={dict.label} className="grid grid-cols-3 gap-1">
      {steps.map((step, i) => {
        const next = steps[i + 1]
        return (
          <li key={step.label} className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center" aria-hidden>
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  i === current
                    ? cn(statusClass[shipment.status].dot, "ring-[3px]", halo[shipment.status])
                    : step.date
                      ? "bg-graphite-700"
                      : "border border-fg-faint/60 bg-surface",
                )}
              />
              {next && (
                <span
                  className={cn("mx-1.5 h-px flex-1", next.date ? "bg-fg/25" : "border-t border-dashed border-fg/20")}
                />
              )}
            </div>
            <span className={cn("truncate text-[11.5px] font-medium", i === current ? "text-fg" : "text-fg-muted")}>
              {step.label}
            </span>
            <span className={cn("truncate text-[11.5px] tabular-nums", step.date ? "text-fg-soft" : "text-fg-faint")}>
              {step.date ? formatDateTime(step.date, locale) : step.skipped ? dict.skipped : dict.notYet}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
