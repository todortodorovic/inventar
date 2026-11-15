"use client"

import { useApp } from "@/components/app/app-provider"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, plural } from "@/lib/format"
import { shipmentPieces, shipmentProfit, shipmentTotal } from "@/lib/inventory/selectors"
import type { Shipment } from "@/lib/inventory/types"
import type { ShipmentCommand } from "./commands"

/** The "are you sure?" for status moves that touch stock or sales, and for deleting. */
export function ShipmentConfirm({
  open,
  onOpenChange,
  command,
  shipment,
  onConfirm,
  dict,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  command: ShipmentCommand
  shipment: Shipment
  onConfirm: () => void
  dict: Dictionary["shipments"]["confirm"]
}) {
  const { locale, t } = useApp()
  const values = {
    code: shipment.code,
    amount: formatMoney(shipmentTotal(shipment), locale),
    profit: formatMoney(shipmentProfit(shipment), locale),
    pieces: plural(t.units.pieces, shipmentPieces(shipment), locale),
  }
  const copy: Partial<Record<ShipmentCommand, { title: string; text: string; confirm: string; destructive: boolean }>> = {
    deliver: { title: dict.deliverTitle, text: dict.deliverText, confirm: dict.deliverConfirm, destructive: false },
    return: { title: dict.returnTitle, text: dict.returnText, confirm: dict.returnConfirm, destructive: false },
    cancel: { title: dict.cancelTitle, text: dict.cancelText, confirm: dict.cancelConfirm, destructive: true },
    undeliver: { title: dict.undeliverTitle, text: dict.undeliverText, confirm: dict.undeliverConfirm, destructive: true },
    delete: {
      title: dict.deleteTitle,
      text: shipment.status === "pending" ? dict.deletePendingText : dict.deleteReturnedText,
      confirm: t.actions.delete,
      destructive: true,
    },
  }
  const c = copy[command]
  if (!c) return null
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={fill(c.title, values)}
      description={fill(c.text, values)}
      confirmLabel={c.confirm}
      onConfirm={onConfirm}
      destructive={c.destructive}
    />
  )
}
