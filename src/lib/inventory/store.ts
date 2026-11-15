"use client"

import { useSyncExternalStore } from "react"
import { siteConfig } from "@/config/site"
import { reduce, type ArticleInput, type InventoryAction, type ShipmentDetails, type ShipmentItemInput } from "./reducer"
import { createDemoState, createEmptyState } from "./seed"
import type { Id, InventoryErrorCode, InventoryState, ShipmentStatus } from "./types"

/**
 * The one place inventory data is kept: an in-memory snapshot mirrored to
 * this tab's sessionStorage. Nothing leaves the browser, and closing the tab
 * forgets it. To move to a real database, replace `load`/`persist` (and make
 * `dispatch` call the API); components only use `useInventory` and `inventory`.
 *
 * On the server and during hydration the snapshot is `null`, so pages render a
 * skeleton first and fill in once the browser's data is read.
 */

let snapshot: InventoryState | null = null
const listeners = new Set<() => void>()

function load(): InventoryState {
  try {
    const raw = sessionStorage.getItem(siteConfig.inventory.storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as InventoryState
      if (parsed?.version === 1 && Array.isArray(parsed.articles)) return parsed
    }
  } catch {
    // Private mode, blocked storage or a corrupt entry: start from the demo.
  }
  const demo = createDemoState(new Date())
  persist(demo)
  return demo
}

function persist(state: InventoryState) {
  try {
    sessionStorage.setItem(siteConfig.inventory.storageKey, JSON.stringify(state))
  } catch {
    // Storage full or unavailable: keep working in memory for this page view.
  }
}

function getSnapshot(): InventoryState {
  snapshot ??= load()
  return snapshot
}

const getServerSnapshot = () => null

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export type DispatchResult = { ok: true } | { ok: false; error: InventoryErrorCode }
/** Result of an action that creates a record: `id` is the new record's id. */
export type CreateResult = { ok: true; id: Id } | { ok: false; error: InventoryErrorCode }

const withId = (result: DispatchResult, id: Id): CreateResult => (result.ok ? { ok: true, id } : result)

function dispatch(action: InventoryAction): DispatchResult {
  const result = reduce(getSnapshot(), action)
  if (!result.ok) return result
  if (result.state !== snapshot) {
    snapshot = result.state
    persist(snapshot)
    for (const listener of listeners) listener()
  }
  return { ok: true }
}

/** The current inventory, or `null` until the browser's copy has been read. */
export function useInventory(): InventoryState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

const stamp = () => ({ nonce: crypto.randomUUID(), at: new Date().toISOString() })

/**
 * Everything the UI can do to the inventory. Each call returns
 * `{ ok: true }` (plus `id` for creates) or `{ ok: false, error }`; translate `error` with
 * `dict.common.errors[error]`.
 */
export const inventory = {
  createArticle: (input: ArticleInput, quantity: number): CreateResult => {
    const s = stamp()
    return withId(dispatch({ type: "article/create", ...s, input, quantity }), `${s.nonce}:a`)
  },

  updateArticle: (id: Id, input: ArticleInput) =>
    dispatch({ type: "article/update", id, at: new Date().toISOString(), input }),

  /** Sets the counted quantity (stocktake correction). */
  adjustQuantity: (id: Id, quantity: number, note = "") =>
    dispatch({ type: "article/adjust", id, ...stamp(), quantity, note }),

  deleteArticle: (id: Id) => dispatch({ type: "article/delete", id }),

  /** Prijem: `quantity` more pieces at `unitPurchasePrice` each. */
  receiveStock: (articleId: Id, quantity: number, unitPurchasePrice: number, note = "") =>
    dispatch({ type: "stock/receive", articleId, ...stamp(), quantity, unitPurchasePrice, note }),

  sell: (input: {
    articleId: Id
    quantity: number
    unitSalePrice: number
    buyer?: string
    note?: string
    /** ISO date; defaults to now. */
    date?: string
  }): CreateResult => {
    const s = stamp()
    const result = dispatch({
      type: "sale/create",
      ...s,
      articleId: input.articleId,
      quantity: input.quantity,
      unitSalePrice: input.unitSalePrice,
      buyer: input.buyer ?? "",
      note: input.note ?? "",
      ...(input.date && { date: input.date }),
    })
    return withId(result, `${s.nonce}:s`)
  },

  /** Undo a direct sale; its pieces go back on the shelf. */
  undoSale: (id: Id) => dispatch({ type: "sale/undo", id, ...stamp() }),

  /** The new shipment's `code` is on the record: `state.shipments.find(s => s.id === id)`. */
  createShipment: (details: ShipmentDetails, items: ShipmentItemInput[]): CreateResult => {
    const s = stamp()
    return withId(dispatch({ type: "shipment/create", ...s, details, items }), `${s.nonce}:p`)
  },

  updateShipment: (id: Id, details: ShipmentDetails) => dispatch({ type: "shipment/update", id, details }),

  setShipmentStatus: (id: Id, status: ShipmentStatus) =>
    dispatch({ type: "shipment/status", id, ...stamp(), status }),

  deleteShipment: (id: Id) => dispatch({ type: "shipment/delete", id, ...stamp() }),

  /** Start over with the demo data. */
  resetDemo: () => dispatch({ type: "data/replace", state: createDemoState(new Date()) }),

  /** Start over with nothing. */
  clear: () => dispatch({ type: "data/replace", state: createEmptyState() }),
}
