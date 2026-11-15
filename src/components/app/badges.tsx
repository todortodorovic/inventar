"use client"

import { useApp } from "@/components/app/app-provider"
import type { StockLevel } from "@/lib/inventory/selectors"
import type { SaleChannel, ShipmentStatus } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

/** Small, square-shouldered tags: a soft fill, a dot and the word. Never colour alone. */
const tag = "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-[6px] px-2 text-[12px] leading-none font-medium whitespace-nowrap"

/** Soft fill, ink (text) and dot per shipment status (tokens in globals.css). */
export const statusClass: Record<ShipmentStatus, { chip: string; dot: string }> = {
  pending: { chip: "bg-status-pending-soft text-status-pending-ink", dot: "bg-status-pending" },
  sent: { chip: "bg-status-sent-soft text-status-sent-ink", dot: "bg-status-sent" },
  delivered: { chip: "bg-status-delivered-soft text-status-delivered-ink", dot: "bg-status-delivered" },
  returned: { chip: "bg-status-returned-soft text-status-returned-ink", dot: "bg-status-returned" },
}

export function ShipmentStatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const { t } = useApp()
  return (
    <span className={cn(tag, statusClass[status].chip, className)}>
      <span className={cn("size-1.5 rounded-full", statusClass[status].dot)} aria-hidden />
      {t.shipmentStatus[status]}
    </span>
  )
}

const stockClass: Record<StockLevel, { chip: string; dot: string }> = {
  ok: { chip: "bg-status-delivered-soft text-status-delivered-ink", dot: "bg-status-delivered" },
  low: { chip: "bg-status-pending-soft text-status-pending-ink", dot: "bg-status-pending" },
  // The most urgent state: the only solid chip in the system.
  out: { chip: "bg-danger text-fg-inverse font-semibold", dot: "bg-fg-inverse" },
}

export function StockBadge({ level, className }: { level: StockLevel; className?: string }) {
  const { t } = useApp()
  return (
    <span className={cn(tag, stockClass[level].chip, className)}>
      <span className={cn("size-1.5 rounded-full", stockClass[level].dot)} aria-hidden />
      {t.stock[level]}
    </span>
  )
}

/**
 * Where a sale came from: direct (neutral outline) or a shipment (sky). Pass
 * `code` to show the shipment's code inside the chip, in mono; a muted
 * `code` (e.g. "deleted") is set in Inter via `codeMissing`.
 */
export function ChannelBadge({
  channel,
  code,
  codeMissing = false,
  className,
}: {
  channel: SaleChannel
  code?: string
  codeMissing?: boolean
  className?: string
}) {
  const { t } = useApp()
  return (
    <span
      className={cn(
        tag,
        "ring-1 ring-inset",
        channel === "direct" ? "bg-surface text-fg-soft ring-hairline-strong" : "bg-status-sent-soft text-status-sent-ink ring-status-sent/20",
        className,
      )}
    >
      {t.saleChannel[channel]}
      {code && (
        <>
          <span className="h-3 w-px bg-current opacity-25" aria-hidden />
          <span className={codeMissing ? "font-normal opacity-75" : "font-code text-[11px] font-medium"}>{code}</span>
        </>
      )}
    </span>
  )
}
