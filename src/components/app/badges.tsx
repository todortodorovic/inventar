"use client"

import { useApp } from "@/components/app/app-provider"
import type { StockLevel } from "@/lib/inventory/selectors"
import type { SaleChannel, ShipmentStatus } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

const pill = "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap"

/** Soft fill and strong ink per shipment status (tokens in globals.css). */
export const statusClass: Record<ShipmentStatus, { chip: string; dot: string }> = {
  pending: { chip: "bg-status-pending-soft text-[oklch(0.45_0.11_65)]", dot: "bg-status-pending" },
  sent: { chip: "bg-status-sent-soft text-[oklch(0.42_0.13_250)]", dot: "bg-status-sent" },
  delivered: { chip: "bg-status-delivered-soft text-[oklch(0.4_0.11_150)]", dot: "bg-status-delivered" },
  returned: { chip: "bg-status-returned-soft text-[oklch(0.45_0.15_25)]", dot: "bg-status-returned" },
}

export function ShipmentStatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const { t } = useApp()
  return (
    <span className={cn(pill, statusClass[status].chip, className)}>
      <span className={cn("size-1.5 rounded-full", statusClass[status].dot)} aria-hidden />
      {t.shipmentStatus[status]}
    </span>
  )
}

const stockClass: Record<StockLevel, string> = {
  ok: "bg-status-delivered-soft text-[oklch(0.4_0.11_150)]",
  low: "bg-status-pending-soft text-[oklch(0.45_0.11_65)]",
  out: "bg-ink/6 text-ink-muted",
}

export function StockBadge({ level, className }: { level: StockLevel; className?: string }) {
  const { t } = useApp()
  return <span className={cn(pill, stockClass[level], className)}>{t.stock[level]}</span>
}

export function ChannelBadge({ channel, className }: { channel: SaleChannel; className?: string }) {
  const { t } = useApp()
  return (
    <span className={cn(pill, channel === "direct" ? "bg-ink/6 text-ink-soft" : "bg-status-sent-soft text-[oklch(0.42_0.13_250)]", className)}>
      {t.saleChannel[channel]}
    </span>
  )
}
