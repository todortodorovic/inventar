import type {
  Article,
  Id,
  InventoryErrorCode,
  InventoryState,
  Movement,
  MovementType,
  Recipient,
  Sale,
  Shipment,
  ShipmentItem,
  ShipmentStatus,
} from "./types"

/**
 * Every change to the inventory goes through `reduce`. It is pure: ids and
 * timestamps come in on the action (see `actions.ts`), so the same action
 * always produces the same state. Invalid actions are refused with an error
 * code instead of throwing, and leave the state untouched.
 *
 * Stock rules:
 * - `Article.quantity` is what is on the shelf.
 * - A direct sale takes pieces off the shelf and records a `Sale`.
 * - A new shipment takes its pieces off the shelf right away (they are packed).
 * - Delivered ("leglo") turns each shipment item into a `Sale`.
 * - Returned, or deleting a shipment that has not gone out yet, puts the
 *   pieces back on the shelf.
 */

export type ArticleInput = {
  name: string
  category: string
  sku: string
  note: string
  purchasePrice: number
  salePrice: number
}

export type ShipmentDetails = {
  recipient: Recipient
  shippingCost: number
  trackingNumber: string
  note: string
}

export type ShipmentItemInput = { articleId: Id; quantity: number; unitSalePrice: number }

/** `nonce` is unique per action; the reducer derives record ids from it. */
export type InventoryAction =
  | { type: "article/create"; nonce: string; at: string; input: ArticleInput; quantity: number }
  | { type: "article/update"; id: Id; at: string; input: ArticleInput }
  | { type: "article/adjust"; id: Id; nonce: string; at: string; quantity: number; note: string }
  | { type: "article/delete"; id: Id }
  | {
      type: "stock/receive"
      articleId: Id
      nonce: string
      at: string
      quantity: number
      unitPurchasePrice: number
      note: string
    }
  | {
      type: "sale/create"
      nonce: string
      at: string
      /** When the sale happened; defaults to `at`. */
      date?: string
      articleId: Id
      quantity: number
      unitSalePrice: number
      buyer: string
      note: string
    }
  | { type: "sale/undo"; id: Id; nonce: string; at: string }
  | {
      type: "shipment/create"
      nonce: string
      at: string
      details: ShipmentDetails
      items: ShipmentItemInput[]
    }
  | { type: "shipment/update"; id: Id; details: ShipmentDetails }
  | { type: "shipment/status"; id: Id; nonce: string; at: string; status: ShipmentStatus }
  | { type: "shipment/delete"; id: Id; nonce: string; at: string }
  | { type: "data/replace"; state: InventoryState }

export type ReduceResult =
  | { ok: true; state: InventoryState }
  | { ok: false; error: InventoryErrorCode }

/** Which status changes are allowed, from → to. Undo steps included. */
export const shipmentTransitions: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  pending: ["sent", "delivered", "returned"],
  sent: ["delivered", "returned", "pending"],
  delivered: ["sent"],
  returned: [],
}

export function canTransition(from: ShipmentStatus, to: ShipmentStatus) {
  return shipmentTransitions[from].includes(to)
}

/** A shipment can be deleted before it goes out (stock is restored) or after it came back. */
export function canDeleteShipment(status: ShipmentStatus) {
  return status === "pending" || status === "returned"
}

const fail = (error: InventoryErrorCode): ReduceResult => ({ ok: false, error })
const done = (state: InventoryState): ReduceResult => ({ ok: true, state })

const isWhole = (n: number, min: number) => Number.isFinite(n) && Number.isInteger(n) && n >= min
const isPrice = (n: number) => isWhole(n, 0)

function cleanInput(input: ArticleInput): ArticleInput | null {
  const name = input.name.trim()
  if (!name || !isPrice(input.purchasePrice) || !isPrice(input.salePrice)) return null
  return {
    name,
    category: input.category.trim(),
    sku: input.sku.trim(),
    note: input.note.trim(),
    purchasePrice: input.purchasePrice,
    salePrice: input.salePrice,
  }
}

function cleanDetails(details: ShipmentDetails): ShipmentDetails | null {
  const r = details.recipient
  const recipient: Recipient = {
    name: r.name.trim(),
    phone: r.phone.trim(),
    address: r.address.trim(),
    city: r.city.trim(),
    postalCode: r.postalCode.trim(),
  }
  if (!recipient.name || !recipient.phone || !isPrice(details.shippingCost)) return null
  return {
    recipient,
    shippingCost: details.shippingCost,
    trackingNumber: details.trackingNumber.trim(),
    note: details.note.trim(),
  }
}

function movement(
  id: Id,
  articleId: Id,
  type: MovementType,
  quantity: number,
  unitPrice: number,
  date: string,
  refId?: Id,
  note?: string,
): Movement {
  return { id, articleId, type, quantity, unitPrice, date, ...(refId && { refId }), ...(note && { note }) }
}

function setArticle(state: InventoryState, article: Article): Article[] {
  return state.articles.map((a) => (a.id === article.id ? article : a))
}

/** Puts shipment items back on the shelf, skipping articles deleted since. */
function restock(
  state: InventoryState,
  shipment: Shipment,
  nonce: string,
  at: string,
): Pick<InventoryState, "articles" | "movements"> {
  const back = new Map<Id, number>()
  for (const item of shipment.items) back.set(item.articleId, (back.get(item.articleId) ?? 0) + item.quantity)
  const movements = [...state.movements]
  const articles = state.articles.map((a) => {
    const qty = back.get(a.id)
    if (!qty) return a
    const item = shipment.items.find((i) => i.articleId === a.id)!
    movements.push(
      movement(`${nonce}:m:${a.id}`, a.id, "shipment-return", qty, item.unitSalePrice, at, shipment.id),
    )
    return { ...a, quantity: a.quantity + qty, updatedAt: at }
  })
  return { articles, movements }
}

export function reduce(state: InventoryState, action: InventoryAction): ReduceResult {
  switch (action.type) {
    case "article/create": {
      const input = cleanInput(action.input)
      if (!input || !isWhole(action.quantity, 0)) return fail("invalid-input")
      const id = `${action.nonce}:a`
      const article: Article = {
        id,
        ...input,
        quantity: action.quantity,
        createdAt: action.at,
        updatedAt: action.at,
      }
      const movements =
        action.quantity > 0
          ? [
              ...state.movements,
              movement(`${action.nonce}:m`, id, "opening", action.quantity, input.purchasePrice, action.at),
            ]
          : state.movements
      return done({ ...state, articles: [article, ...state.articles], movements })
    }

    case "article/update": {
      const article = state.articles.find((a) => a.id === action.id)
      if (!article) return fail("not-found")
      const input = cleanInput(action.input)
      if (!input) return fail("invalid-input")
      return done({ ...state, articles: setArticle(state, { ...article, ...input, updatedAt: action.at }) })
    }

    case "article/adjust": {
      const article = state.articles.find((a) => a.id === action.id)
      if (!article) return fail("not-found")
      if (!isWhole(action.quantity, 0)) return fail("invalid-input")
      const delta = action.quantity - article.quantity
      if (delta === 0) return done(state)
      return done({
        ...state,
        articles: setArticle(state, { ...article, quantity: action.quantity, updatedAt: action.at }),
        movements: [
          ...state.movements,
          movement(
            `${action.nonce}:m`,
            article.id,
            "adjust",
            delta,
            article.purchasePrice,
            action.at,
            undefined,
            action.note.trim(),
          ),
        ],
      })
    }

    case "article/delete": {
      const article = state.articles.find((a) => a.id === action.id)
      if (!article) return fail("not-found")
      const open = state.shipments.some(
        (s) => (s.status === "pending" || s.status === "sent") && s.items.some((i) => i.articleId === article.id),
      )
      if (open) return fail("article-in-shipment")
      return done({
        ...state,
        articles: state.articles.filter((a) => a.id !== article.id),
        movements: state.movements.filter((m) => m.articleId !== article.id),
      })
    }

    case "stock/receive": {
      const article = state.articles.find((a) => a.id === action.articleId)
      if (!article) return fail("not-found")
      if (!isWhole(action.quantity, 1) || !isPrice(action.unitPurchasePrice)) return fail("invalid-input")
      const total = article.quantity + action.quantity
      // Weighted average cost, so profit on the next sale reflects what was actually paid.
      const purchasePrice = Math.round(
        (article.quantity * article.purchasePrice + action.quantity * action.unitPurchasePrice) / total,
      )
      return done({
        ...state,
        articles: setArticle(state, { ...article, quantity: total, purchasePrice, updatedAt: action.at }),
        movements: [
          ...state.movements,
          movement(
            `${action.nonce}:m`,
            article.id,
            "receive",
            action.quantity,
            action.unitPurchasePrice,
            action.at,
            undefined,
            action.note.trim(),
          ),
        ],
      })
    }

    case "sale/create": {
      const article = state.articles.find((a) => a.id === action.articleId)
      if (!article) return fail("not-found")
      if (!isWhole(action.quantity, 1) || !isPrice(action.unitSalePrice)) return fail("invalid-input")
      if (action.quantity > article.quantity) return fail("insufficient-stock")
      const date = action.date ?? action.at
      const sale: Sale = {
        id: `${action.nonce}:s`,
        articleId: article.id,
        articleName: article.name,
        category: article.category,
        quantity: action.quantity,
        unitPurchasePrice: article.purchasePrice,
        unitSalePrice: action.unitSalePrice,
        date,
        channel: "direct",
        buyer: action.buyer.trim(),
        note: action.note.trim(),
      }
      return done({
        ...state,
        articles: setArticle(state, { ...article, quantity: article.quantity - action.quantity, updatedAt: action.at }),
        sales: [sale, ...state.sales],
        movements: [
          ...state.movements,
          movement(`${action.nonce}:m`, article.id, "sale", -action.quantity, action.unitSalePrice, date, sale.id),
        ],
      })
    }

    case "sale/undo": {
      const sale = state.sales.find((s) => s.id === action.id)
      if (!sale) return fail("not-found")
      // Shipment sales are undone by moving the shipment back from "delivered".
      if (sale.channel !== "direct") return fail("invalid-transition")
      const article = state.articles.find((a) => a.id === sale.articleId)
      return done({
        ...state,
        sales: state.sales.filter((s) => s.id !== sale.id),
        articles: article
          ? setArticle(state, { ...article, quantity: article.quantity + sale.quantity, updatedAt: action.at })
          : state.articles,
        movements: article
          ? [
              ...state.movements,
              movement(`${action.nonce}:m`, article.id, "sale-undo", sale.quantity, sale.unitSalePrice, action.at, sale.id),
            ]
          : state.movements,
      })
    }

    case "shipment/create": {
      const details = cleanDetails(action.details)
      if (!details || action.items.length === 0) return fail("invalid-input")

      // The same article picked twice becomes one line.
      const lines = new Map<Id, ShipmentItemInput>()
      for (const item of action.items) {
        if (!isWhole(item.quantity, 1) || !isPrice(item.unitSalePrice)) return fail("invalid-input")
        const prev = lines.get(item.articleId)
        lines.set(item.articleId, prev ? { ...prev, quantity: prev.quantity + item.quantity } : item)
      }

      const id = `${action.nonce}:p`
      const items: ShipmentItem[] = []
      const movements = [...state.movements]
      let articles = state.articles
      for (const line of lines.values()) {
        const article = articles.find((a) => a.id === line.articleId)
        if (!article) return fail("not-found")
        if (line.quantity > article.quantity) return fail("insufficient-stock")
        items.push({
          articleId: article.id,
          articleName: article.name,
          category: article.category,
          quantity: line.quantity,
          unitPurchasePrice: article.purchasePrice,
          unitSalePrice: line.unitSalePrice,
        })
        articles = articles.map((a) =>
          a.id === article.id ? { ...a, quantity: a.quantity - line.quantity, updatedAt: action.at } : a,
        )
        movements.push(
          movement(`${action.nonce}:m:${article.id}`, article.id, "shipment", -line.quantity, line.unitSalePrice, action.at, id),
        )
      }

      const shipment: Shipment = {
        id,
        code: `P-${String(state.nextShipmentNo).padStart(4, "0")}`,
        ...details,
        items,
        status: "pending",
        createdAt: action.at,
      }
      return done({
        ...state,
        articles,
        movements,
        shipments: [shipment, ...state.shipments],
        nextShipmentNo: state.nextShipmentNo + 1,
      })
    }

    case "shipment/update": {
      const shipment = state.shipments.find((s) => s.id === action.id)
      if (!shipment) return fail("not-found")
      const details = cleanDetails(action.details)
      if (!details) return fail("invalid-input")
      return done({
        ...state,
        shipments: state.shipments.map((s) => (s.id === shipment.id ? { ...s, ...details } : s)),
      })
    }

    case "shipment/status": {
      const shipment = state.shipments.find((s) => s.id === action.id)
      if (!shipment) return fail("not-found")
      const from = shipment.status
      const to = action.status
      if (!canTransition(from, to)) return fail("invalid-transition")

      let next: InventoryState = state
      const updated: Shipment = { ...shipment, status: to }

      if (to === "sent") {
        updated.sentAt = from === "pending" ? action.at : shipment.sentAt
        delete updated.deliveredAt
        if (from === "delivered") {
          // Undo "leglo": the sales it created go away, the parcel is out again.
          next = { ...next, sales: next.sales.filter((s) => s.shipmentId !== shipment.id) }
        }
      } else if (to === "pending") {
        delete updated.sentAt
      } else if (to === "delivered") {
        updated.deliveredAt = action.at
        if (!updated.sentAt) updated.sentAt = action.at
        const sales: Sale[] = shipment.items.map((item, i) => ({
          id: `${action.nonce}:s${i}`,
          articleId: item.articleId,
          articleName: item.articleName,
          category: item.category,
          quantity: item.quantity,
          unitPurchasePrice: item.unitPurchasePrice,
          unitSalePrice: item.unitSalePrice,
          date: action.at,
          channel: "shipment",
          shipmentId: shipment.id,
          buyer: shipment.recipient.name,
          note: "",
        }))
        next = { ...next, sales: [...sales, ...next.sales] }
      } else if (to === "returned") {
        updated.returnedAt = action.at
        next = { ...next, ...restock(next, shipment, action.nonce, action.at) }
      }

      return done({ ...next, shipments: next.shipments.map((s) => (s.id === shipment.id ? updated : s)) })
    }

    case "shipment/delete": {
      const shipment = state.shipments.find((s) => s.id === action.id)
      if (!shipment) return fail("not-found")
      if (!canDeleteShipment(shipment.status)) return fail("invalid-transition")
      const restored = shipment.status === "pending" ? restock(state, shipment, action.nonce, action.at) : {}
      return done({
        ...state,
        ...restored,
        shipments: state.shipments.filter((s) => s.id !== shipment.id),
      })
    }

    case "data/replace":
      return done(action.state)
  }
}
