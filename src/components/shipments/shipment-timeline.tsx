"use client"

import { useApp } from "@/components/app/app-provider"
import type { Dictionary } from "@/content/types"
import { formatDateTime } from "@/lib/format"
import type { Shipment } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

type Step = { label: string; date?: string; dot: string; skipped?: boolean }

/** Packed → sent → delivered/returned, with the date each step happened. */
export function ShipmentTimeline({ shipment, dict }: { shipment: Shipment; dict: Dictionary["shipments"]["timeline"] }) {
  const { locale } = useApp()
  const returned = shipment.status === "returned"
  const steps: Step[] = [
    { label: dict.created, date: shipment.createdAt, dot: "bg-ink" },
    // A parcel cancelled before it went out never had a "sent" step.
    { label: dict.sent, date: shipment.sentAt, dot: "bg-status-sent", skipped: returned && !shipment.sentAt },
    returned
      ? { label: dict.returned, date: shipment.returnedAt, dot: "bg-status-returned" }
      : { label: dict.delivered, date: shipment.deliveredAt, dot: "bg-status-delivered" },
  ]

  return (
    <ol aria-label={dict.label} className="grid grid-cols-3 gap-1">
      {steps.map((step, i) => {
        const next = steps[i + 1]
        return (
          <li key={step.label} className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center" aria-hidden>
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  step.date ? step.dot : "border border-dashed border-ink-faint bg-white",
                )}
              />
              {next && (
                <span
                  className={cn("mx-1.5 h-px flex-1", next.date ? "bg-ink/25" : "border-t border-dashed border-ink/20")}
                />
              )}
            </div>
            <span className="truncate font-mono text-[10.5px] font-medium tracking-[0.12em] text-ink-muted uppercase">
              {step.label}
            </span>
            <span className={cn("truncate text-xs tabular-nums", step.date ? "text-ink-soft" : "text-ink-faint")}>
              {step.date ? formatDateTime(step.date, locale) : step.skipped ? dict.skipped : dict.notYet}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
