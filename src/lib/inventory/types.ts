/**
 * The inventory domain. Every amount is a whole number in `siteConfig.currency`
 * and every date is an ISO 8601 string. Records keep a snapshot of the
 * article's name and prices at the time they were made, so history stays
 * correct after an article is edited or deleted.
 */

export type Id = string

/** One kind of item kept in stock; `quantity` pieces of it are on hand. */
export type Article = {
  id: Id
  name: string
  category: string
  /** Optional stock-keeping code shown in monospace. */
  sku: string
  note: string
  /** Cost of one piece (nabavna cena). Weighted average across receipts. */
  purchasePrice: number
  /** Asking price of one piece (prodajna cena). */
  salePrice: number
  /** Pieces on the shelf. Pieces packed into an open shipment are not counted here. */
  quantity: number
  createdAt: string
  updatedAt: string
}

export type MovementType =
  /** Article created with an opening quantity. */
  | "opening"
  /** Pieces received into stock (prijem). */
  | "receive"
  /** Sold directly, out of stock. */
  | "sale"
  /** A direct sale was undone; pieces back on the shelf. */
  | "sale-undo"
  /** Packed into a shipment. */
  | "shipment"
  /** A shipment was cancelled or returned; pieces back on the shelf. */
  | "shipment-return"
  /** Manual correction of the count. */
  | "adjust"

/** Every change to an article's quantity, newest last. `quantity` is signed. */
export type Movement = {
  id: Id
  articleId: Id
  type: MovementType
  quantity: number
  /** Unit purchase price for `receive`/`opening`, unit sale price for sales. */
  unitPrice: number
  date: string
  /** Sale or shipment this movement belongs to. */
  refId?: Id
  note?: string
}

export type SaleChannel = "direct" | "shipment"

/** A completed sale: money is in. Profit = (unitSalePrice − unitPurchasePrice) × quantity. */
export type Sale = {
  id: Id
  articleId: Id
  articleName: string
  category: string
  quantity: number
  unitPurchasePrice: number
  unitSalePrice: number
  date: string
  channel: SaleChannel
  /** Set when the sale came from a delivered shipment. */
  shipmentId?: Id
  buyer: string
  note: string
}

/**
 * pending   → packed, waiting to go out (za slanje)
 * sent      → handed to the courier (poslato)
 * delivered → delivered and paid (leglo); the items become sales
 * returned  → came back or was cancelled; the items are back in stock
 */
export type ShipmentStatus = "pending" | "sent" | "delivered" | "returned"

export type ShipmentItem = {
  articleId: Id
  articleName: string
  category: string
  quantity: number
  unitPurchasePrice: number
  unitSalePrice: number
}

export type Recipient = {
  name: string
  phone: string
  address: string
  city: string
  postalCode: string
}

export type Shipment = {
  id: Id
  /** Human-friendly running number, e.g. `P-0007`. */
  code: string
  recipient: Recipient
  items: ShipmentItem[]
  /** Postage the seller pays; subtracted from profit once delivered. 0 if the buyer pays. */
  shippingCost: number
  trackingNumber: string
  note: string
  status: ShipmentStatus
  createdAt: string
  sentAt?: string
  deliveredAt?: string
  returnedAt?: string
}

export type InventoryState = {
  version: 1
  articles: Article[]
  sales: Sale[]
  shipments: Shipment[]
  movements: Movement[]
  /** Next number for `Shipment.code`. */
  nextShipmentNo: number
}

/** Why an action was refused. Translated in the `common.errors` dictionary. */
export type InventoryErrorCode =
  | "not-found"
  | "invalid-input"
  | "insufficient-stock"
  | "invalid-transition"
  | "article-in-shipment"
  /** Undo of "article created" after the article was already used. */
  | "article-changed"
