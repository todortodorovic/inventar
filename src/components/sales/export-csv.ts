import type { Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { saleProfit, saleRevenue } from "@/lib/inventory/selectors"
import type { Sale } from "@/lib/inventory/types"
import { dayKey, formatStamp } from "./period"

/**
 * Downloads `sales` as a CSV a spreadsheet opens directly. Excel only reads
 * UTF-8 (č ć š ž đ) when the file starts with a BOM, and in a Serbian locale
 * it expects `;` because `,` is the decimal separator.
 */
export function exportSalesCsv({
  sales,
  shipmentCodes,
  locale,
  dict,
  common,
  now,
}: {
  sales: Sale[]
  shipmentCodes: Map<string, string>
  locale: Locale
  dict: Dictionary["sales"]["csv"]
  common: Dictionary["common"]
  now: Date
}) {
  const sep = locale === "sr" ? ";" : ","
  const text = (value: string) => {
    // A leading = + - @ would run as a formula in a spreadsheet.
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
    return /[";,\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }

  const header = [
    dict.date,
    dict.article,
    dict.category,
    dict.channel,
    dict.shipment,
    dict.buyer,
    dict.quantity,
    dict.unitPurchase,
    dict.unitSale,
    dict.revenue,
    dict.profit,
    dict.note,
  ].map(text)

  const rows = sales.map((s) =>
    [
      text(formatStamp(s.date)),
      text(s.articleName),
      text(s.category),
      text(common.saleChannel[s.channel]),
      text((s.shipmentId && shipmentCodes.get(s.shipmentId)) || ""),
      text(s.buyer),
      String(s.quantity),
      String(s.unitPurchasePrice),
      String(s.unitSalePrice),
      String(saleRevenue(s)),
      String(saleProfit(s)),
      text(s.note),
    ].join(sep),
  )

  const csv = "\uFEFF" + [header.join(sep), ...rows].join("\r\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${dict.filename}-${dayKey(now.toISOString())}.csv`
  document.body.append(a)
  a.click()
  a.remove()
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
