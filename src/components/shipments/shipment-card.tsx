"use client"

import {
  BanIcon,
  CopyIcon,
  HandCoinsIcon,
  MapPinIcon,
  PackageXIcon,
  PencilIcon,
  PhoneIcon,
  RotateCcwIcon,
  SendIcon,
  StickyNoteIcon,
  Trash2Icon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react"
import { useId } from "react"
import { useApp } from "@/components/app/app-provider"
import { ShipmentStatusBadge } from "@/components/app/badges"
import { Panel } from "@/components/app/panel"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatRelativeDays, plural } from "@/lib/format"
import { shipmentPieces, shipmentProfit, shipmentTotal } from "@/lib/inventory/selectors"
import type { Shipment } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { statusCommands, type ShipmentCommand } from "./commands"
import { ShipmentTimeline } from "./shipment-timeline"

const icons: Record<ShipmentCommand, LucideIcon> = {
  send: SendIcon,
  deliver: HandCoinsIcon,
  return: PackageXIcon,
  undeliver: RotateCcwIcon,
  backToPending: Undo2Icon,
  cancel: BanIcon,
  edit: PencilIcon,
  copy: CopyIcon,
  delete: Trash2Icon,
}

/** Status moves shown as labelled pills; the rest are quieter icon buttons. */
const textCommands = new Set<ShipmentCommand>(["send", "deliver", "return", "undeliver"])

/** Corner wash in the status colour, like Catena's package-builder cards. */
const wash: Record<Shipment["status"], string> = {
  pending: "var(--status-pending-soft)",
  sent: "var(--status-sent-soft)",
  delivered: "var(--status-delivered-soft)",
  returned: "var(--status-returned-soft)",
}

export function ShipmentCard({
  shipment,
  now,
  dict,
  onCommand,
}: {
  shipment: Shipment
  now: Date
  dict: Dictionary["shipments"]
  onCommand: (command: ShipmentCommand, shipment: Shipment) => void
}) {
  const { locale, t } = useApp()
  const titleId = useId()
  const r = shipment.recipient
  const cod = shipmentTotal(shipment)
  const profit = shipmentProfit(shipment)
  const place = [r.postalCode, r.city].filter(Boolean).join(" ")
  const address = [r.address, place].filter(Boolean).join(", ")

  const status = statusCommands(shipment.status)
  const pills = status.filter((c) => textCommands.has(c))
  const iconButtons: ShipmentCommand[] = [
    ...status.filter((c) => c === "backToPending" || c === "cancel"),
    "edit",
    "copy",
    ...status.filter((c) => c === "delete"),
  ]
  const label = (c: ShipmentCommand) => (c === "edit" || c === "delete" ? t.actions[c] : dict.actions[c])

  return (
    <Panel aria-labelledby={titleId} className="relative flex min-w-0 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: `radial-gradient(110% 100% at 100% 0%, ${wash[shipment.status]}, transparent 72%)` }}
      />

      <div className="relative flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-ink/6 px-2 py-0.5 font-mono text-xs font-semibold tracking-[0.06em]">
            {shipment.code}
          </span>
          <ShipmentStatusBadge status={shipment.status} />
          <span className="ml-auto text-[13px] text-ink-muted">
            {formatRelativeDays(shipment.createdAt, locale, now)}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <h3 id={titleId} className="font-display text-[21px] leading-tight font-semibold tracking-[-0.025em] break-words">
            {r.name}
          </h3>
          <p className={cn("flex items-start gap-2 text-sm", address ? "text-ink-soft" : "text-ink-faint")}>
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
            <span className="min-w-0 break-words">{address || dict.card.noAddress}</span>
          </p>
          <a
            href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}
            aria-label={fill(dict.card.call, { phone: r.phone })}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-sand pr-4 pl-3.5 text-[15px] font-semibold tabular-nums transition-colors outline-none hover:bg-stone focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <PhoneIcon className="size-4 text-ink-muted" aria-hidden />
            {r.phone}
          </a>
        </div>

        <div className="rounded-2xl bg-sand/70 px-4 py-3.5">
          <p className="mb-2 flex justify-between gap-3 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">
            <span>{dict.card.items}</span>
            <span>{plural(t.units.pieces, shipmentPieces(shipment), locale)}</span>
          </p>
          <ul className="flex flex-col gap-2">
            {shipment.items.map((item) => (
              <li key={item.articleId} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium break-words">{item.articleName}</span>
                  <span className="text-ink-muted"> × {item.quantity}</span>
                  {item.quantity > 1 && (
                    <span className="block text-xs text-ink-muted tabular-nums">
                      {fill(dict.card.each, { price: formatMoney(item.unitSalePrice, locale) })}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums">{formatMoney(item.unitSalePrice * item.quantity, locale)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">{dict.card.cod}</p>
            <p className="font-display text-[30px] leading-none font-bold tracking-[-0.04em] tabular-nums">
              {formatMoney(cod, locale)}
            </p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-[13px]">
            {shipment.shippingCost > 0 && (
              <>
                <dt className="text-ink-muted">{dict.card.shipping}</dt>
                <dd className="text-right tabular-nums">−{formatMoney(shipment.shippingCost, locale)}</dd>
              </>
            )}
            {shipment.status !== "returned" && (
              <>
                <dt className="text-ink-muted">
                  {shipment.status === "delivered" ? t.fields.profit : t.fields.expectedProfit}
                </dt>
                <dd className={cn("text-right font-semibold tabular-nums", profit < 0 ? "text-loss" : "text-gain")}>
                  {formatMoney(profit, locale)}
                </dd>
              </>
            )}
          </dl>
        </div>

        {(shipment.trackingNumber || shipment.note) && (
          <div className="flex flex-col gap-1.5 text-[13px]">
            {shipment.trackingNumber && (
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-ink-muted">{dict.card.tracking}</span>
                <span className="font-mono tracking-[0.04em] break-all select-all">{shipment.trackingNumber}</span>
              </p>
            )}
            {shipment.note && (
              <p className="flex items-start gap-2 text-ink-soft">
                <StickyNoteIcon className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />
                <span className="min-w-0 break-words">{shipment.note}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-auto pt-1">
          <ShipmentTimeline shipment={shipment} dict={dict.timeline} />
        </div>
      </div>

      <div
        role="group"
        aria-label={fill(dict.card.actions, { code: shipment.code })}
        className="relative flex flex-wrap items-center gap-2 border-t border-line px-4 pt-3.5 pb-4 sm:px-5"
      >
        {pills.map((c, i) => {
          const Icon = icons[c]
          const primary = i === 0 && (c === "send" || (c === "deliver" && shipment.status === "sent"))
          return (
            <Button
              key={c}
              variant={primary ? "brand" : "outline"}
              size="cta"
              className={cn(!primary && "rounded-full", primary && "mb-1")}
              onClick={() => onCommand(c, shipment)}
            >
              <Icon data-icon="inline-start" aria-hidden />
              {label(c)}
            </Button>
          )
        })}
        <div className="ml-auto flex items-center">
          {iconButtons.map((c) => {
            const Icon = icons[c]
            return (
              <Button
                key={c}
                variant="ghost"
                size="icon"
                aria-label={label(c)}
                title={label(c)}
                className={cn("size-10 rounded-full text-ink-muted", c === "delete" && "hover:text-destructive")}
                onClick={() => onCommand(c, shipment)}
              >
                <Icon className="size-[18px]" aria-hidden />
              </Button>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
