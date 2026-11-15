import { expectedProfit, marginOf, matches, stockCost, stockLevel, stockValue, type StockLevel } from "@/lib/inventory/selectors"
import type { Article } from "@/lib/inventory/types"

/** Filter values that are not a category name. */
export const ALL = "__all__"
export const NO_CATEGORY = "__none__"

export const sortKeys = ["name", "quantity", "profit", "margin", "updated"] as const
export type SortKey = (typeof sortKeys)[number]

export type Filters = {
  query: string
  category: string
  level: StockLevel | typeof ALL
  sort: SortKey
}

export const initialFilters: Filters = { query: "", category: ALL, level: ALL, sort: "name" }

export const isFiltered = (f: Filters) => f.query.trim() !== "" || f.category !== ALL || f.level !== ALL

const searchMatch = (a: Article, query: string) => matches(query, a.name, a.sku, a.category, a.note)
const categoryMatch = (a: Article, category: string) =>
  category === ALL || (category === NO_CATEGORY ? !a.category : a.category === category)
const levelMatch = (a: Article, level: Filters["level"]) => level === ALL || stockLevel(a) === level

/**
 * Counts for each filter take the other filters into account, so a chip
 * shows how many rows picking it would leave.
 */
export function facetCounts(articles: Article[], f: Filters) {
  const categories = new Map<string, number>()
  const levels: Record<StockLevel | typeof ALL, number> = { [ALL]: 0, ok: 0, low: 0, out: 0 }
  let categoryTotal = 0
  for (const a of articles) {
    if (!searchMatch(a, f.query)) continue
    if (levelMatch(a, f.level)) {
      const key = a.category || NO_CATEGORY
      categories.set(key, (categories.get(key) ?? 0) + 1)
      categoryTotal++
    }
    if (categoryMatch(a, f.category)) {
      levels[ALL]++
      levels[stockLevel(a)]++
    }
  }
  categories.set(ALL, categoryTotal)
  return { categories, levels }
}

export function applyFilters(articles: Article[], f: Filters, locale: string): Article[] {
  const rows = articles.filter((a) => searchMatch(a, f.query) && categoryMatch(a, f.category) && levelMatch(a, f.level))
  const byName = (a: Article, b: Article) => a.name.localeCompare(b.name, locale)
  const margin = (a: Article) => marginOf(a.salePrice, a.purchasePrice) ?? -Infinity
  const compare: Record<SortKey, (a: Article, b: Article) => number> = {
    name: byName,
    quantity: (a, b) => b.quantity - a.quantity || byName(a, b),
    profit: (a, b) => expectedProfit(b) - expectedProfit(a) || byName(a, b),
    margin: (a, b) => margin(b) - margin(a) || byName(a, b),
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || byName(a, b),
  }
  return rows.sort(compare[f.sort])
}

export type Totals = { articles: number; pieces: number; cost: number; value: number; profit: number }

export function totalsOf(articles: Article[]): Totals {
  const t: Totals = { articles: articles.length, pieces: 0, cost: 0, value: 0, profit: 0 }
  for (const a of articles) {
    t.pieces += a.quantity
    t.cost += stockCost(a)
    t.value += stockValue(a)
    t.profit += expectedProfit(a)
  }
  return t
}
