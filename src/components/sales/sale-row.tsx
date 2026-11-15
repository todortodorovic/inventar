"use client"

import { ArrowUpRightIcon, Undo2Icon } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/components/app/app-provider"
import { ChannelBadge } from "@/components/app/badges"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatPercent, formatSigned } from "@/lib/format"
import { marginOf, saleProfit, saleRevenue } from "@/lib/inventory/selectors"
import type { Sale } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { formatTime } from "./period"
import { profitText } from "@/components/app/money"

/** Desktop column template; the header row in `SaleList` uses the same one. */
export const saleColumns =
  "md:grid-cols-[48px_minmax(0,1fr)_128px_112px_112px_40px] lg:grid-cols-[48px_minmax(0,1.5fr)_minmax(0,150px)_minmax(0,1fr)_128px_116px_120px_40px]"


/**
 * One sale. Phones get a compact card, wider screens a row in the day's
 * grid. Direct sales can be undone here; shipment sales link to Pošiljke,
 * where "leglo" is undone.
 */
export function SaleRow({
  sale,
  shipmentCode,
  highlighted,
  dict,
  onUndo,
}: {
  sale: Sale
  /** Code of the shipment the sale came from, if it still exists. */
  shipmentCode?: string
  highlighted: boolean
  dict: Dictionary["sales"]["list"]
  onUndo: (sale: Sale) => void
}) {
  const { t, locale } = useApp()
  const revenue = saleRevenue(sale)
  const profit = saleProfit(sale)
  const margin = marginOf(sale.unitSalePrice, sale.unitPurchasePrice)
  const time = formatTime(sale.date, locale)
  const category = sale.category || dict.noCategory
  const each = `${sale.quantity} × ${formatMoney(sale.unitSalePrice, locale)}`
  const shipmentsHref = localePath(locale, "shipments")
  const code = shipmentCode ?? dict.deletedShipment

  const channel = (
    <span className="flex min-w-0">
      <ChannelBadge
        channel={sale.channel}
        code={sale.channel === "shipment" ? code : undefined}
        codeMissing={!shipmentCode}
      />
    </span>
  )

  const profitBlock = (
    <span className="flex flex-col items-end leading-tight">
      <span className={cn("font-semibold tabular-nums", profitText(profit))}>
        <span className="sr-only">{t.fields.profit}: </span>
        {formatSigned(profit, locale)}
      </span>
      {margin !== null && (
        <span className="text-[11.5px] text-fg-faint tabular-nums">
          {fill(dict.marginShort, { pct: formatPercent(margin, locale) })}
        </span>
      )}
    </span>
  )

  const action =
    sale.channel === "direct" ? (
      <Button
        variant="ghost"
        size="icon"
        className="size-10 text-fg-muted hover:text-fg md:size-8"
        aria-label={fill(dict.undoLabel, { name: sale.articleName })}
        title={dict.undo}
        data-sale-action={sale.id}
        onClick={() => onUndo(sale)}
      >
        <Undo2Icon />
      </Button>
    ) : (
      <Link
        href={shipmentsHref}
        aria-label={fill(dict.shipmentLink, { code })}
        title={fill(dict.shipmentLink, { code })}
        data-sale-action={sale.id}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-10 text-fg-faint hover:text-fg md:size-8")}
      >
        <ArrowUpRightIcon />
      </Link>
    )

  return (
    <li
      className={cn(
        "border-t border-hairline px-4 py-3 transition-colors first:border-t-0 sm:px-5 md:py-2",
        // A just-booked sale: the lime selection tint with a lime-family edge (never lime text).
        highlighted ? "bg-accent-soft shadow-[inset_3px_0_0_var(--accent-edge)]" : "hover:bg-surface-hover",
      )}
    >
      {/* Phone: a compact card. */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">{sale.articleName}</p>
            <p className="truncate text-[12.5px] text-fg-muted">
              {time} · {category}
              {sale.buyer && ` · ${sale.buyer}`}
            </p>
          </div>
          <p className="shrink-0 text-right text-[15px] font-semibold tabular-nums">
            <span className="sr-only">{t.fields.revenue}: </span>
            {formatMoney(revenue, locale)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {channel}
            <span className="text-[12.5px] text-fg-muted tabular-nums">{each}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {profitBlock}
            {action}
          </div>
        </div>
      </div>

      {/* Tablet and up: a row in the day's grid. */}
      <div className={cn("hidden items-center gap-3 text-[13.5px] md:grid xl:gap-4", saleColumns)}>
        <span className="text-[12.5px] text-fg-muted tabular-nums">{time}</span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{sale.articleName}</span>
          <span className="truncate text-[12.5px] text-fg-muted">{category}</span>
          <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 lg:hidden">
            {channel}
            {sale.buyer && <span className="truncate text-[13px] text-fg-soft">{sale.buyer}</span>}
          </span>
        </span>
        <span className="hidden min-w-0 lg:block">{channel}</span>
        <span className={cn("hidden truncate lg:block", sale.buyer ? "text-fg-soft" : "text-fg-faint")}>
          {sale.buyer || (
            <>
              <span aria-hidden>—</span>
              <span className="sr-only">{dict.noBuyer}</span>
            </>
          )}
        </span>
        <span className="text-right text-fg-muted tabular-nums">{each}</span>
        <span className="text-right font-semibold tabular-nums">
          <span className="sr-only">{t.fields.revenue}: </span>
          {formatMoney(revenue, locale)}
        </span>
        {profitBlock}
        <span className="flex justify-end">{action}</span>
      </div>
    </li>
  )
}
