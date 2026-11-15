import { canDeleteShipment, shipmentTransitions } from "@/lib/inventory/reducer"
import type { Shipment, ShipmentStatus } from "@/lib/inventory/types"

/** Everything a shipment card can ask the panel to do. */
export type ShipmentCommand =
  | "send"
  | "deliver"
  | "return"
  | "cancel"
  | "backToPending"
  | "undeliver"
  | "delete"
  | "edit"
  | "copy"

/** Commands that change data in a way worth a second look. */
export const needsConfirm = new Set<ShipmentCommand>(["deliver", "return", "cancel", "undeliver", "delete"])

/** Status a command moves to, for the ones that are status changes. */
export const commandTarget: Partial<Record<ShipmentCommand, ShipmentStatus>> = {
  send: "sent",
  deliver: "delivered",
  return: "returned",
  cancel: "returned",
  backToPending: "pending",
  undeliver: "sent",
}

/** Names the move from → to; the same target means different things from different places. */
function commandFor(from: ShipmentStatus, to: ShipmentStatus): ShipmentCommand {
  if (to === "delivered") return "deliver"
  if (to === "pending") return "backToPending"
  if (to === "returned") return from === "pending" ? "cancel" : "return"
  return from === "delivered" ? "undeliver" : "send"
}

/**
 * Status buttons straight from the reducer's allowed transitions, so the UI
 * can never offer a move it would refuse. Listed in the reducer's order, so
 * the first one is the natural next step.
 */
export function statusCommands(status: ShipmentStatus): ShipmentCommand[] {
  const out = shipmentTransitions[status].map((to) => commandFor(status, to))
  if (canDeleteShipment(status)) out.push("delete")
  return out
}

/** What a courier needs, one item per line, ready to paste into their form or a message. */
export function courierText(shipment: Shipment, codLabel: string, cod: string) {
  const r = shipment.recipient
  return [r.name, r.phone, r.address, [r.postalCode, r.city].filter(Boolean).join(" "), `${codLabel}: ${cod}`]
    .filter(Boolean)
    .join("\n")
}
