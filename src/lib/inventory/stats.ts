import {
  expectedProfit,
  isOpenShipment,
  marginOf,
  saleCost,
  saleProfit,
  saleRevenue,
  shipmentPieces,
  shipmentProfit,
  shipmentTotal,
  stockCost,
  stockLevel,
  stockValue,
} from "./selectors"
import type { Article, Id, InventoryState, Sale, Shipment, ShipmentStatus } from "./types"

/**
 * Aggregates for the overview (statistics) section. Pure and React-free: pass
 * the state from `useInventory()` and a `now` captured once, so every number
 * on the page is computed against the same moment. Per-record numbers come
 * from `selectors.ts`; this file only sums them up.
 */

// ── Periods ────────────────────────────────────────────────────────────────

export type PeriodKey = "7d" | "30d" | "3m" | "12m" | "all"
export const periodKeys: readonly PeriodKey[] = ["7d", "30d", "3m", "12m", "all"]

/** Half-open time range `[start, end)` in epoch ms; `start: null` is "since the beginning". */
export type DateRange = { start: number | null; end: number }

const DAY = 86_400_000

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/**
 * The selected period as whole local days ending with today, plus the
 * equal-length range right before it (null for "all", which has nothing to
 * compare with).
 */
export function periodRange(period: PeriodKey, now: Date): { current: DateRange; previous: DateRange | null } {
  const end = startOfDay(now).getTime() + DAY
  if (period === "all") return { current: { start: null, end }, previous: null }
  let start: number
  if (period === "7d" || period === "30d") {
    start = end - (period === "7d" ? 7 : 30) * DAY
  } else {
    const d = startOfDay(now)
    d.setMonth(d.getMonth() - (period === "3m" ? 3 : 12))
    start = d.getTime() + DAY
  }
  return { current: { start, end }, previous: { start: start - (end - start), end: start } }
}

export function inRange(iso: string | undefined, range: DateRange): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return (range.start === null || t >= range.start) && t < range.end
}

// ── Sales and profit for a period ──────────────────────────────────────────

export type SalesTotals = {
  revenue: number
  cost: number
  grossProfit: number
  pieces: number
  /** Number of sale records. */
  count: number
}

export function salesIn(state: InventoryState, range: DateRange): Sale[] {
  return state.sales.filter((s) => inRange(s.date, range))
}

export function sumSales(sales: readonly Sale[]): SalesTotals {
  const totals: SalesTotals = { revenue: 0, cost: 0, grossProfit: 0, pieces: 0, count: sales.length }
  for (const s of sales) {
    totals.revenue += saleRevenue(s)
    totals.cost += saleCost(s)
    totals.grossProfit += saleProfit(s)
    totals.pieces += s.quantity
  }
  return totals
}

export const salesTotals = (state: InventoryState, range: DateRange) => sumSales(salesIn(state, range))

/**
 * Postage the seller paid on shipments delivered in the range. It is
 * subtracted when the parcel is delivered (that is when its sales appear),
 * matching `shipmentProfit`.
 */
export function shippingCostsIn(state: InventoryState, range: DateRange): number {
  let sum = 0
  for (const sh of state.shipments) if (sh.status === "delivered" && inRange(sh.deliveredAt, range)) sum += sh.shippingCost
  return sum
}

export type PeriodSummary = SalesTotals & {
  shippingCosts: number
  /** Gross profit minus postage on delivered parcels. */
  netProfit: number
  /** Net profit as a share of revenue (0–1), or null with no revenue. */
  margin: number | null
}

export function periodSummary(state: InventoryState, range: DateRange): PeriodSummary {
  const totals = salesTotals(state, range)
  const shippingCosts = shippingCostsIn(state, range)
  const netProfit = totals.grossProfit - shippingCosts
  return { ...totals, shippingCosts, netProfit, margin: marginOf(totals.revenue, totals.revenue - netProfit) }
}

/** True when anything at all happened in the range (a sale or a delivered parcel). */
export const hasActivity = (s: PeriodSummary) => s.count > 0 || s.shippingCosts > 0

/**
 * Relative change from `previous` to `current` (0.12 = +12%), or null when
 * there is nothing to compare with. A negative base is measured by its size,
 * so going from −1.000 to +1.000 reads as growth.
 */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

// ── Months ─────────────────────────────────────────────────────────────────

export type MonthPoint = {
  /** First day of the month, local time. */
  month: Date
  revenue: number
  /** Net profit: gross profit of the month's sales minus postage on parcels delivered that month. */
  profit: number
  pieces: number
}

const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth()

/**
 * Revenue and net profit per calendar month for the last `months` months
 * (current month included), starting no earlier than the month of the first
 * sale or delivery. Empty when there is no data.
 */
export function monthlySeries(state: InventoryState, now: Date, months = 12): MonthPoint[] {
  const last = monthIndex(now)
  let first = Infinity
  for (const s of state.sales) first = Math.min(first, monthIndex(new Date(s.date)))
  for (const sh of state.shipments) if (sh.status === "delivered" && sh.deliveredAt) first = Math.min(first, monthIndex(new Date(sh.deliveredAt)))
  if (first === Infinity) return []
  first = Math.min(last, Math.max(first, last - months + 1))

  const points: MonthPoint[] = []
  for (let i = first; i <= last; i++) {
    points.push({ month: new Date(Math.floor(i / 12), i % 12, 1), revenue: 0, profit: 0, pieces: 0 })
  }
  const at = (iso: string) => {
    const i = monthIndex(new Date(iso))
    return i >= first && i <= last ? points[i - first] : undefined
  }
  for (const s of state.sales) {
    const p = at(s.date)
    if (!p) continue
    p.revenue += saleRevenue(s)
    p.profit += saleProfit(s)
    p.pieces += s.quantity
  }
  for (const sh of state.shipments) {
    if (sh.status !== "delivered" || !sh.deliveredAt) continue
    const p = at(sh.deliveredAt)
    if (p) p.profit -= sh.shippingCost
  }
  return points
}

// ── Breakdowns ─────────────────────────────────────────────────────────────

export type CategoryProfit = { category: string; revenue: number; profit: number; pieces: number }

/** Gross profit per category (before postage, which is per parcel, not per item), largest first. */
export function profitByCategory(sales: readonly Sale[]): CategoryProfit[] {
  const map = new Map<string, CategoryProfit>()
  for (const s of sales) {
    const key = s.category || ""
    const row = map.get(key) ?? { category: key, revenue: 0, profit: 0, pieces: 0 }
    row.revenue += saleRevenue(s)
    row.profit += saleProfit(s)
    row.pieces += s.quantity
    map.set(key, row)
  }
  return [...map.values()].sort((a, b) => b.profit - a.profit || b.revenue - a.revenue)
}

export type ArticleProfit = {
  articleId: Id
  /** Current name if the article still exists, else the name on its latest sale. */
  name: string
  category: string
  pieces: number
  revenue: number
  profit: number
}

/** The `limit` articles that earned the most gross profit in `sales`. */
export function topArticles(state: InventoryState, sales: readonly Sale[], limit = 5): ArticleProfit[] {
  const names = new Map(state.articles.map((a) => [a.id, a.name]))
  const map = new Map<Id, ArticleProfit & { latest: number }>()
  for (const s of sales) {
    const row = map.get(s.articleId) ?? {
      articleId: s.articleId,
      name: s.articleName,
      category: s.category,
      pieces: 0,
      revenue: 0,
      profit: 0,
      latest: -Infinity,
    }
    const t = new Date(s.date).getTime()
    if (t > row.latest) Object.assign(row, { latest: t, name: s.articleName, category: s.category })
    row.pieces += s.quantity
    row.revenue += saleRevenue(s)
    row.profit += saleProfit(s)
    map.set(s.articleId, row)
  }
  return [...map.values()]
    .sort((a, b) => b.profit - a.profit || b.pieces - a.pieces)
    .slice(0, limit)
    .map((row) => ({
      articleId: row.articleId,
      name: names.get(row.articleId) ?? row.name,
      category: row.category,
      pieces: row.pieces,
      revenue: row.revenue,
      profit: row.profit,
    }))
}

// ── Right now ──────────────────────────────────────────────────────────────

export type StockSummary = {
  /** What the pieces on the shelf cost. */
  cost: number
  /** What they would bring at the asking prices. */
  value: number
  expectedProfit: number
  pieces: number
  articles: number
  low: number
  out: number
}

export function stockSummary(state: InventoryState): StockSummary {
  const sum: StockSummary = { cost: 0, value: 0, expectedProfit: 0, pieces: 0, articles: state.articles.length, low: 0, out: 0 }
  for (const a of state.articles) {
    sum.cost += stockCost(a)
    sum.value += stockValue(a)
    sum.expectedProfit += expectedProfit(a)
    sum.pieces += Math.max(0, a.quantity)
    const level = stockLevel(a)
    if (level === "low") sum.low++
    else if (level === "out") sum.out++
  }
  return sum
}

/** Articles that are out of stock or running low: out first, then fewest pieces, then by name. */
export function lowStockArticles(state: InventoryState, locale: string): Article[] {
  return state.articles
    .filter((a) => stockLevel(a) !== "ok")
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name, locale))
}

export type StatusTotals = {
  count: number
  pieces: number
  /** Cash on delivery the recipients pay (items only). */
  cod: number
  /** Profit once delivered, postage already taken off. */
  expectedProfit: number
}

const emptyTotals = (): StatusTotals => ({ count: 0, pieces: 0, cod: 0, expectedProfit: 0 })

function addShipment(t: StatusTotals, sh: Shipment) {
  t.count++
  t.pieces += shipmentPieces(sh)
  t.cod += shipmentTotal(sh)
  t.expectedProfit += shipmentProfit(sh)
}

/** Parcels still holding stock ("na putu": packed or with the courier), in total and per status. */
export function openShipmentsSummary(state: InventoryState): StatusTotals & { byStatus: Record<"pending" | "sent", StatusTotals> } {
  const total = emptyTotals()
  const byStatus = { pending: emptyTotals(), sent: emptyTotals() }
  for (const sh of state.shipments) {
    if (!isOpenShipment(sh)) continue
    addShipment(total, sh)
    addShipment(byStatus[sh.status as "pending" | "sent"], sh)
  }
  return { ...total, byStatus }
}

export const shipmentStatusOrder: readonly ShipmentStatus[] = ["pending", "sent", "delivered", "returned"]

/**
 * Parcels by current status: those created in the range, plus every parcel
 * still open (an old one waiting to be posted must never drop out of sight).
 */
export function shipmentPipeline(state: InventoryState, range: DateRange): Record<ShipmentStatus, StatusTotals> & { total: StatusTotals } {
  const out = { pending: emptyTotals(), sent: emptyTotals(), delivered: emptyTotals(), returned: emptyTotals(), total: emptyTotals() }
  for (const sh of state.shipments) {
    if (!isOpenShipment(sh) && !inRange(sh.createdAt, range)) continue
    addShipment(out[sh.status], sh)
    addShipment(out.total, sh)
  }
  return out
}

// ── Activity feed ──────────────────────────────────────────────────────────

export type ActivityEvent =
  | { kind: "sale"; key: string; date: string; sale: Sale }
  | { kind: "shipment"; key: string; date: string; status: ShipmentStatus; shipment: Shipment }

/**
 * The latest events, newest first: direct sales and every status a parcel
 * reached (packed, sent, delivered, returned). Sales created by a delivery
 * are left out; the delivery stands for them.
 */
export function recentActivity(state: InventoryState, limit = 8): ActivityEvent[] {
  const events: ActivityEvent[] = []
  for (const sale of state.sales) {
    if (!sale.shipmentId) events.push({ kind: "sale", key: `s:${sale.id}`, date: sale.date, sale })
  }
  for (const sh of state.shipments) {
    const push = (status: ShipmentStatus, date: string | undefined) => {
      if (date) events.push({ kind: "shipment", key: `p:${sh.id}:${status}`, date, status, shipment: sh })
    }
    push("pending", sh.createdAt)
    push("sent", sh.sentAt)
    push("delivered", sh.status === "delivered" ? sh.deliveredAt : undefined)
    push("returned", sh.status === "returned" ? sh.returnedAt : undefined)
  }
  const time = (e: ActivityEvent) => new Date(e.date).getTime()
  return events.sort((a, b) => time(b) - time(a)).slice(0, limit)
}
