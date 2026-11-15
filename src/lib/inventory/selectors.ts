import { siteConfig } from "@/config/site"
import type { Article, Id, InventoryState, Sale, Shipment, ShipmentStatus } from "./types"

/**
 * Derived numbers shared by every panel, so "profit" means the same thing
 * everywhere. All pure; pass them the state from `useInventory()`.
 */

/** Profit on one piece at the asking price. */
export const unitProfit = (a: Pick<Article, "purchasePrice" | "salePrice">) => a.salePrice - a.purchasePrice

/** Profit as a share of the sale price (0–1), or null when the price is 0. */
export const marginOf = (salePrice: number, purchasePrice: number) =>
  salePrice > 0 ? (salePrice - purchasePrice) / salePrice : null

/** What the pieces on the shelf cost. */
export const stockCost = (a: Article) => a.purchasePrice * a.quantity

/** What the pieces on the shelf would bring at the asking price. */
export const stockValue = (a: Article) => a.salePrice * a.quantity

/** Profit if every piece on the shelf sells at the asking price (očekivani profit). */
export const expectedProfit = (a: Article) => unitProfit(a) * a.quantity

export type StockLevel = "out" | "low" | "ok"

export function stockLevel(a: Article): StockLevel {
  if (a.quantity <= 0) return "out"
  if (a.quantity <= siteConfig.inventory.lowStockAt) return "low"
  return "ok"
}

export const saleRevenue = (s: Sale) => s.unitSalePrice * s.quantity
export const saleCost = (s: Sale) => s.unitPurchasePrice * s.quantity
export const saleProfit = (s: Sale) => saleRevenue(s) - saleCost(s)

/** Cash on delivery: what the recipient pays for the items. */
export const shipmentTotal = (sh: Shipment) => sh.items.reduce((sum, i) => sum + i.unitSalePrice * i.quantity, 0)
export const shipmentCost = (sh: Shipment) => sh.items.reduce((sum, i) => sum + i.unitPurchasePrice * i.quantity, 0)
export const shipmentPieces = (sh: Shipment) => sh.items.reduce((sum, i) => sum + i.quantity, 0)
/** Profit once delivered: items' margin minus postage the seller pays. */
export const shipmentProfit = (sh: Shipment) => shipmentTotal(sh) - shipmentCost(sh) - sh.shippingCost

/** Shipments that still hold stock: packed or on the way. */
export const isOpenShipment = (sh: Shipment) => sh.status === "pending" || sh.status === "sent"

/** Pieces of each article packed in open shipments (not on the shelf, not sold yet). */
export function piecesInShipments(state: InventoryState): Map<Id, number> {
  const out = new Map<Id, number>()
  for (const sh of state.shipments) {
    if (!isOpenShipment(sh)) continue
    for (const item of sh.items) out.set(item.articleId, (out.get(item.articleId) ?? 0) + item.quantity)
  }
  return out
}

export function countByStatus(state: InventoryState): Record<ShipmentStatus, number> {
  const counts: Record<ShipmentStatus, number> = { pending: 0, sent: 0, delivered: 0, returned: 0 }
  for (const sh of state.shipments) counts[sh.status]++
  return counts
}

/** Every category in use, sorted for the current locale. */
export function categoriesOf(state: InventoryState, locale: string): string[] {
  const set = new Set<string>()
  for (const a of state.articles) if (a.category) set.add(a.category)
  for (const s of state.sales) if (s.category) set.add(s.category)
  return [...set].sort((a, b) => a.localeCompare(b, locale))
}

/** Lower-case, accent-free text for search: "Šrafciger" matches "srafciger". */
export function normalize(text: string) {
  return text
    .toLocaleLowerCase("sr-Latn")
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

/** True when every word of `query` appears in one of `fields`. */
export function matches(query: string, ...fields: (string | undefined)[]) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = normalize(fields.filter(Boolean).join(" "))
  return words.every((w) => haystack.includes(w))
}
