"use client"

import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, formatPercent, plural } from "@/lib/format"
import { countByStatus, shipmentProfit, shipmentTotal } from "@/lib/inventory/selectors"
import type { InventoryState, Shipment, ShipmentStatus } from "@/lib/inventory/types"

const sum = (list: Shipment[], of: (sh: Shipment) => number) => list.reduce((total, sh) => total + of(sh), 0)

/** Four headline numbers: what waits, what is out, what paid this month, what came back. */
export function ShipmentStats({
  state,
  now,
  dict,
}: {
  state: InventoryState
  now: Date
  dict: Dictionary["shipments"]["stats"]
}) {
  const { locale } = useApp()
  const counts = countByStatus(state)
  const by = (status: ShipmentStatus) => state.shipments.filter((sh) => sh.status === status)

  const deliveredThisMonth = by("delivered").filter((sh) => {
    const d = new Date(sh.deliveredAt ?? sh.createdAt)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const profit = sum(deliveredThisMonth, shipmentProfit)
  const finished = counts.delivered + counts.returned

  return (
    <section aria-label={dict.label} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label={dict.pending}
        accent="var(--status-pending)"
        value={formatNumber(counts.pending, locale)}
        hint={fill(dict.pendingHint, { amount: formatMoney(sum(by("pending"), shipmentTotal), locale) })}
      />
      <StatTile
        label={dict.sent}
        accent="var(--status-sent)"
        value={formatNumber(counts.sent, locale)}
        hint={fill(dict.sentHint, { amount: formatMoney(sum(by("sent"), shipmentTotal), locale) })}
      />
      <StatTile
        label={dict.delivered}
        accent="var(--status-delivered)"
        value={formatMoney(profit, locale)}
        tone={profit < 0 ? "loss" : "gain"}
        hint={plural(dict.deliveredHint, deliveredThisMonth.length, locale)}
      />
      <StatTile
        label={dict.returned}
        accent="var(--status-returned)"
        value={formatNumber(counts.returned, locale)}
        hint={
          counts.returned > 0
            ? fill(dict.returnedHint, { percent: formatPercent(counts.returned / finished, locale) })
            : dict.returnedNone
        }
      />
    </section>
  )
}
