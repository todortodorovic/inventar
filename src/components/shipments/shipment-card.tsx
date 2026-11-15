"use client"

import {
  BanIcon,
  CopyIcon,
  EllipsisIcon,
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
import { useId, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { useApp } from "@/components/app/app-provider"
import { ShipmentStatusBadge } from "@/components/app/badges"
import { Panel } from "@/components/app/panel"
import { Button } from "@/components/ui/button"
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, useAfterMenuCloses } from "@/components/ui/menu"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatRelativeDays, plural } from "@/lib/format"
import { shipmentPieces, shipmentProfit, shipmentTotal } from "@/lib/inventory/selectors"
import type { Shipment, ShipmentStatus } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { statusCommands, type ShipmentCommand } from "./commands"
import { ShipmentTimeline } from "./shipment-timeline"
import { profitText } from "@/components/app/money"

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

/** Status moves shown as labelled buttons; the rest go to icons or the ⋯ menu. */
const textCommands = new Set<ShipmentCommand>(["send", "deliver", "return", "undeliver"])
/** Menu entries that take stock or a record away: red, after a separator. */
const dangerCommands = new Set<ShipmentCommand>(["cancel", "delete"])

/** The meta bar: a whisper (≈7%) of the status colour over white. */
const metaTint: Record<ShipmentStatus, string> = {
  pending: "bg-[color-mix(in_oklab,var(--status-pending)_8%,var(--surface))]",
  sent: "bg-[color-mix(in_oklab,var(--status-sent)_7%,var(--surface))]",
  delivered: "bg-[color-mix(in_oklab,var(--status-delivered)_7%,var(--surface))]",
  returned: "bg-[color-mix(in_oklab,var(--status-returned)_6%,var(--surface))]",
}

/** Footer width (px) from which the buttons + icons row fits without wrapping. */
const WIDE_FOOTER = 380

/** True once the element is at least `min` px wide (follows resizes). */
function useWiderThan(ref: RefObject<HTMLElement | null>, min: number) {
  const [wide, setWide] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWide(el.getBoundingClientRect().width >= min)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, min])
  return wide
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
  const footerRef = useRef<HTMLDivElement>(null)
  const wide = useWiderThan(footerRef, WIDE_FOOTER)
  const r = shipment.recipient
  const cod = shipmentTotal(shipment)
  const profit = shipmentProfit(shipment)
  const place = [r.postalCode, r.city].filter(Boolean).join(" ")
  const address = [r.address, place].filter(Boolean).join(", ")

  // The reducer's allowed moves, split into labelled buttons and the rarer ones.
  const status = statusCommands(shipment.status)
  const pills = status.filter((c) => textCommands.has(c))
  const extras = status.filter((c) => !textCommands.has(c))
  // Wide: status buttons on the left, edit/copy icons on the right, rare moves in ⋯.
  // Narrow (phones, 3-up grid): the two main actions 50/50, everything else in ⋯.
  const ordered: ShipmentCommand[] = [...pills, "edit", "copy"]
  const main = wide ? pills : ordered.slice(0, 2)
  const iconCommands: ShipmentCommand[] = wide ? ["edit", "copy"] : []
  const menuCommands = wide ? extras : [...ordered.slice(2), ...extras]

  const label = (c: ShipmentCommand) => (c === "edit" || c === "delete" ? t.actions[c] : dict.actions[c])
  // Only the natural next step of an open parcel is the dark in-card primary.
  const isPrimary = (c: ShipmentCommand) =>
    c === pills[0] && (c === "send" || (c === "deliver" && shipment.status === "sent"))

  return (
    <Panel aria-labelledby={titleId} data-shipment-id={shipment.id} className="flex min-w-0 flex-col overflow-clip">
      {/* Meta bar: code, status, age — tinted in the status colour. */}
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-hairline px-4 py-2 sm:px-5",
          metaTint[shipment.status],
        )}
      >
        <span className="font-code text-[12px] font-semibold text-fg-soft">{shipment.code}</span>
        <ShipmentStatusBadge status={shipment.status} className="bg-surface shadow-xs" />
        <span className="ml-auto text-[12.5px] text-fg-muted">{formatRelativeDays(shipment.createdAt, locale, now)}</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-4 sm:px-5">
        {/* Recipient */}
        <div className="flex flex-col gap-1.5">
          {/* Focusable from script only: the panel puts focus here when a status move removes the button that had it. */}
          <h3
            id={titleId}
            tabIndex={-1}
            data-card-focus
            className="rounded-sm text-[15px] leading-snug font-semibold tracking-[-0.01em] break-words outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {r.name}
          </h3>
          <p className={cn("flex items-start gap-1.5 text-[13px]", address ? "text-fg-muted" : "text-fg-faint")}>
            <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-fg-faint" aria-hidden />
            <span className="min-w-0 break-words">{address || dict.card.noAddress}</span>
          </p>
          <a
            href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}
            aria-label={fill(dict.card.call, { phone: r.phone })}
            className="mt-1 inline-flex h-9 w-fit items-center gap-2 rounded-md border border-hairline-strong bg-surface pr-3 pl-2.5 text-[13.5px] font-medium tabular-nums shadow-xs transition-colors outline-none hover:border-fg-faint/50 hover:bg-surface-hover active:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring max-md:h-11 max-md:pr-3.5 max-md:pl-3"
          >
            <span className="grid size-5 place-items-center rounded-full bg-sunken text-fg-soft" aria-hidden>
              <PhoneIcon className="size-3" />
            </span>
            {r.phone}
          </a>
        </div>

        {/* Contents */}
        <div className="rounded-lg border border-hairline">
          <p className="flex justify-between gap-3 rounded-t-lg border-b border-hairline bg-surface-subtle px-3 py-2 text-[12px] font-medium text-fg-muted">
            <span>{dict.card.items}</span>
            <span className="tabular-nums">{plural(t.units.pieces, shipmentPieces(shipment), locale)}</span>
          </p>
          <ul className="flex flex-col gap-2 px-3 py-2.5">
            {shipment.items.map((item) => (
              <li key={item.articleId} className="flex items-start justify-between gap-3 text-[13px]">
                <span className="min-w-0">
                  <span className="font-medium break-words">{item.articleName}</span>
                  <span className="text-fg-muted tabular-nums"> × {item.quantity}</span>
                  {item.quantity > 1 && (
                    <span className="block text-[12px] text-fg-muted tabular-nums">
                      {fill(dict.card.each, { price: formatMoney(item.unitSalePrice, locale) })}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums">{formatMoney(item.unitSalePrice * item.quantity, locale)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Money: one fixed layout on every card; postage, profit and tracking rows
            are always there, so cards line up and nothing leaves a blank band. */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="type-label">{dict.card.cod}</p>
              <p className="mt-0.5 text-[24px] whitespace-nowrap leading-7 font-semibold tracking-[-0.03em] tabular-nums">{formatMoney(cod, locale)}</p>
            </div>
            <dl className="ml-auto grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-[12.5px]">
              <dt className="text-fg-muted">{dict.card.shipping}</dt>
              <dd className={cn("text-right tabular-nums", shipment.shippingCost > 0 ? "text-fg-soft" : "text-fg-faint")}>
                {shipment.shippingCost > 0 ? `−${formatMoney(shipment.shippingCost, locale)}` : dict.card.buyerPaysShipping}
              </dd>
              <dt className="text-fg-muted">
                {shipment.status === "pending" || shipment.status === "sent" ? t.fields.expectedProfit : t.fields.profit}
              </dt>
              {shipment.status === "returned" ? (
                <dd className="text-right text-fg-faint">—</dd>
              ) : (
                <dd className={cn("text-right font-semibold tabular-nums", profitText(profit))}>
                  {formatMoney(profit, locale)}
                </dd>
              )}
            </dl>
          </div>

          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 border-t border-dashed border-hairline pt-2.5 text-[12.5px]">
            <span className="text-fg-muted">{dict.card.tracking}</span>
            {shipment.trackingNumber ? (
              <span className="min-w-0 font-code text-[11.5px] font-medium break-all text-fg-soft select-all">
                {shipment.trackingNumber}
              </span>
            ) : (
              <span className="text-fg-faint">{dict.card.noTracking}</span>
            )}
          </p>

          {shipment.note && (
            <p className="flex items-start gap-1.5 text-[12.5px] text-fg-soft">
              <StickyNoteIcon className="mt-0.5 size-3.5 shrink-0 text-fg-faint" aria-hidden />
              <span className="min-w-0 break-words">{shipment.note}</span>
            </p>
          )}
        </div>

        <div className="mt-auto border-t border-hairline pt-3.5">
          <ShipmentTimeline shipment={shipment} dict={dict.timeline} />
        </div>
      </div>

      {/* One action bar. */}
      <div
        ref={footerRef}
        role="group"
        aria-label={fill(dict.card.actions, { code: shipment.code })}
        className={cn(
          "border-t border-hairline bg-surface-subtle px-3 py-2.5 sm:px-4",
          wide
            ? "flex items-center gap-2"
            : cn("grid gap-2", main.length === 2 ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-[1fr_auto]"),
        )}
      >
        {/* Keyed by slot, not by command: after "Pošalji" the same button becomes "Leglo",
            so keyboard focus stays on it instead of falling to <body>. */}
        {main.map((c, slot) => {
          const Icon = icons[c]
          return (
            <Button
              key={slot}
              variant={isPrimary(c) ? "dark" : "outline"}
              size="cta"
              className={cn(!wide && "h-11 min-w-0 px-2.5 md:h-9")}
              onClick={() => onCommand(c, shipment)}
            >
              <Icon data-icon="inline-start" aria-hidden />
              <span className="truncate">{label(c)}</span>
            </Button>
          )
        })}

        {(iconCommands.length > 0 || menuCommands.length > 0) && (
          <div className={cn("flex items-center gap-0.5", wide && "ml-auto")}>
            {iconCommands.map((c) => {
              const Icon = icons[c]
              return (
                <Button
                  key={c}
                  variant="ghost"
                  size="icon-lg"
                  aria-label={label(c)}
                  title={label(c)}
                  className="text-fg-muted"
                  onClick={() => onCommand(c, shipment)}
                >
                  <Icon className="size-4" aria-hidden />
                </Button>
              )
            })}
            {menuCommands.length > 0 && (
              <MoreMenu
                commands={menuCommands}
                label={label}
                triggerLabel={fill(dict.card.more, { code: shipment.code })}
                triggerTitle={dict.card.moreShort}
                compact={!wide}
                onSelect={(c) => onCommand(c, shipment)}
              />
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}

/** "⋯": the less frequent moves, each with an icon AND its name. */
function MoreMenu({
  commands,
  label,
  triggerLabel,
  triggerTitle,
  compact,
  onSelect,
}: {
  commands: ShipmentCommand[]
  label: (c: ShipmentCommand) => string
  triggerLabel: string
  triggerTitle: string
  compact: boolean
  onSelect: (c: ShipmentCommand) => void
}) {
  // Dialogs opened from the menu wait until it has closed and handed focus
  // back to ⋯. Copy runs at once: Safari only allows clipboard writes inside the click.
  const { later, onOpenChangeComplete } = useAfterMenuCloses(onSelect)
  const choose = (c: ShipmentCommand) => (c === "copy" ? onSelect(c) : later(c))
  const safe = commands.filter((c) => !dangerCommands.has(c))
  const danger = commands.filter((c) => dangerCommands.has(c))
  const item = (c: ShipmentCommand) => {
    const Icon = icons[c]
    return (
      <MenuItem key={c} label={label(c)} variant={dangerCommands.has(c) ? "destructive" : "default"} onClick={() => choose(c)}>
        <Icon aria-hidden />
        {label(c)}
      </MenuItem>
    )
  }

  return (
    <Menu onOpenChangeComplete={onOpenChangeComplete}>
      <MenuTrigger
        render={
          <Button
            variant={compact ? "outline" : "ghost"}
            size="icon-lg"
            aria-label={triggerLabel}
            title={triggerTitle}
            className={cn(compact ? "size-11 md:size-9" : "text-fg-muted")}
          />
        }
      >
        <EllipsisIcon className="size-4" aria-hidden />
      </MenuTrigger>
      <MenuContent side="top">
        {safe.map(item)}
        {safe.length > 0 && danger.length > 0 && <MenuSeparator />}
        {danger.map(item)}
      </MenuContent>
    </Menu>
  )
}
