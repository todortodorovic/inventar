import { reduce, type InventoryAction } from "./reducer"
import type { InventoryState } from "./types"

/**
 * Demo data: a small shop selling phones, audio, watches and accessories,
 * with six months of history ending today. Built by replaying ordinary
 * actions through the reducer, so the numbers always add up (stock never
 * goes negative, every delivered shipment has its sales, and so on).
 * Deterministic: the same `now` always gives the same data.
 */

export function createEmptyState(): InventoryState {
  return { version: 1, articles: [], sales: [], shipments: [], movements: [], nextShipmentNo: 1 }
}

type Product = {
  name: string
  category: string
  sku: string
  purchasePrice: number
  salePrice: number
  /** Pieces left on the shelf today. */
  remaining: number
  /** Relative popularity. */
  weight: number
  /** Restocked halfway through, at this unit cost. */
  restockAt?: number
}

const products: Product[] = [
  { name: "iPhone 13, 128 GB (polovan)", category: "Telefoni", sku: "TEL-IP13", purchasePrice: 38000, salePrice: 46000, remaining: 2, weight: 3, restockAt: 36500 },
  { name: "Samsung Galaxy S22, 256 GB", category: "Telefoni", sku: "TEL-S22", purchasePrice: 33000, salePrice: 41000, remaining: 1, weight: 2 },
  { name: "Xiaomi Redmi Note 13", category: "Telefoni", sku: "TEL-RN13", purchasePrice: 17500, salePrice: 22990, remaining: 4, weight: 3 },
  { name: "AirPods Pro (2. gen.)", category: "Slušalice", sku: "AUD-APP2", purchasePrice: 19000, salePrice: 25500, remaining: 3, weight: 4, restockAt: 18200 },
  { name: "Sony WH-1000XM4", category: "Slušalice", sku: "AUD-XM4", purchasePrice: 22000, salePrice: 28900, remaining: 0, weight: 2 },
  { name: "JBL Tune 520BT", category: "Slušalice", sku: "AUD-J520", purchasePrice: 3600, salePrice: 5490, remaining: 7, weight: 4 },
  { name: "Apple Watch SE 44 mm", category: "Satovi", sku: "SAT-AWSE", purchasePrice: 18500, salePrice: 24000, remaining: 2, weight: 2 },
  { name: "Garmin Forerunner 55", category: "Satovi", sku: "SAT-FR55", purchasePrice: 14500, salePrice: 19900, remaining: 3, weight: 1 },
  { name: "Amazfit Bip 5", category: "Satovi", sku: "SAT-BIP5", purchasePrice: 6200, salePrice: 8990, remaining: 5, weight: 2 },
  { name: "USB-C punjač 30 W", category: "Punjači i kablovi", sku: "PUN-C30", purchasePrice: 900, salePrice: 1990, remaining: 14, weight: 6, restockAt: 850 },
  { name: "Kabl USB-C na Lightning, 1 m", category: "Punjači i kablovi", sku: "KAB-CL1", purchasePrice: 350, salePrice: 990, remaining: 22, weight: 6 },
  { name: "Bežični punjač 15 W", category: "Punjači i kablovi", sku: "PUN-W15", purchasePrice: 1400, salePrice: 2790, remaining: 1, weight: 3 },
  { name: "Powerbank 20.000 mAh", category: "Punjači i kablovi", sku: "PUN-PB20", purchasePrice: 2300, salePrice: 3990, remaining: 6, weight: 3 },
  { name: "DualSense kontroler", category: "Gaming", sku: "GAM-DS5", purchasePrice: 6900, salePrice: 8990, remaining: 3, weight: 2 },
  { name: "Nintendo Switch OLED", category: "Gaming", sku: "GAM-NSO", purchasePrice: 36000, salePrice: 43500, remaining: 1, weight: 1 },
  { name: "Gaming miš Logitech G305", category: "Gaming", sku: "GAM-G305", purchasePrice: 3900, salePrice: 5490, remaining: 0, weight: 2 },
  { name: "Kaljeno staklo, univerzalno", category: "Maske i zaštita", sku: "ZAS-KS", purchasePrice: 120, salePrice: 690, remaining: 40, weight: 5 },
  { name: "Silikonska maska za iPhone 13", category: "Maske i zaštita", sku: "ZAS-M13", purchasePrice: 250, salePrice: 1190, remaining: 9, weight: 4 },
]

const firstNames = ["Marko", "Jelena", "Nikola", "Ana", "Stefan", "Milica", "Luka", "Teodora", "Filip", "Katarina", "Vuk", "Sara", "Ognjen", "Ivana", "Petar", "Dragana"]
const lastNames = ["Jovanović", "Petrović", "Nikolić", "Marković", "Đorđević", "Stojanović", "Ilić", "Pavlović", "Milošević", "Kostić", "Popović", "Živković"]
const places: [city: string, postalCode: string, street: string][] = [
  ["Beograd", "11000", "Bulevar kralja Aleksandra"],
  ["Novi Sad", "21000", "Bulevar oslobođenja"],
  ["Niš", "18000", "Obrenovićeva"],
  ["Kragujevac", "34000", "Kralja Petra I"],
  ["Subotica", "24000", "Korzo"],
  ["Čačak", "32000", "Gradsko šetalište"],
  ["Kraljevo", "36000", "Omladinska"],
  ["Zrenjanin", "23000", "Kralja Aleksandra I Karađorđevića"],
  ["Pančevo", "26000", "Vojvode Radomira Putnika"],
  ["Šabac", "15000", "Masarikova"],
]

/** Small seeded PRNG (mulberry32). */
function random(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000
const HISTORY_DAYS = 180

export function createDemoState(now: Date): InventoryState {
  const rand = random(20261113)
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]
  const totalWeight = products.reduce((s, p) => s + p.weight, 0)
  const pickProduct = () => {
    let r = rand() * totalWeight
    for (let i = 0; i < products.length; i++) if ((r -= products[i].weight) < 0) return i
    return products.length - 1
  }
  /** A moment `daysAgo` days before now, during opening hours. */
  const at = (daysAgo: number, hour = 9 + Math.floor(rand() * 11)) => {
    const d = new Date(now.getTime() - daysAgo * DAY)
    d.setHours(hour, Math.floor(rand() * 60), 0, 0)
    // Never in the future, even for "today, 19h" at 10 in the morning.
    return new Date(Math.min(d.getTime(), now.getTime() - 60_000 * (1 + daysAgo))).toISOString()
  }
  /** `days` after an ISO time, but never later than a moment ago. */
  const later = (iso: string, days: number) =>
    new Date(Math.min(new Date(iso).getTime() + days * DAY, now.getTime() - 1000)).toISOString()
  const person = () => `${pick(firstNames)} ${pick(lastNames)}`
  const phone = () =>
    `06${Math.floor(rand() * 7)} ${String(Math.floor(rand() * 900) + 100)} ${String(Math.floor(rand() * 9000) + 1000)}`
  /** Mostly asking price, sometimes a small discount rounded to 100. */
  const price = (p: Product) =>
    rand() < 0.25 ? Math.max(p.purchasePrice, Math.round((p.salePrice * (0.92 + rand() * 0.05)) / 100) * 100) : p.salePrice
  const qty = (p: Product) => (p.salePrice < 2000 && rand() < 0.4 ? 2 + Math.floor(rand() * 2) : 1)

  // 1. Plan the outflow: when each piece leaves, and how (direct or by post).
  type Line = { product: number; quantity: number; unitSalePrice: number }
  type Plan = { daysAgo: number } & ({ kind: "direct"; line: Line; buyer: string } | { kind: "shipment"; lines: Line[] })
  const plans: Plan[] = []
  for (let n = 0; n < 78; n++) {
    // Skewed toward recent days, so the business looks like it is growing.
    const daysAgo = Math.floor(HISTORY_DAYS * Math.pow(rand(), 1.35))
    const line = () => {
      const product = pickProduct()
      return { product, quantity: qty(products[product]), unitSalePrice: price(products[product]) }
    }
    if (rand() < 0.4) plans.push({ daysAgo, kind: "direct", line: line(), buyer: rand() < 0.5 ? person() : "" })
    else plans.push({ daysAgo, kind: "shipment", lines: Array.from({ length: rand() < 0.75 ? 1 : 2 }, line) })
  }
  // A few parcels still on their way or waiting to be posted.
  for (const daysAgo of [0, 0, 1, 2, 3, 4]) {
    const product = pickProduct()
    plans.push({ daysAgo, kind: "shipment", lines: [{ product, quantity: 1, unitSalePrice: products[product].salePrice }] })
  }

  // 2. Opening stock covers what leaves before the restock; the restock covers the rest.
  const RESTOCK_DAYS_AGO = 85
  const before = products.map(() => 0)
  const after = products.map(() => 0)
  for (const plan of plans) {
    const lines = plan.kind === "direct" ? [plan.line] : plan.lines
    for (const l of lines) (plan.daysAgo > RESTOCK_DAYS_AGO ? before : after)[l.product] += l.quantity
  }

  // 3. Replay everything in date order through the reducer.
  type Step = { time: string; order: number; action: InventoryAction }
  const steps: Step[] = []
  let seq = 0
  const step = (time: string, action: InventoryAction) => steps.push({ time, order: seq++, action })
  const articleId = (i: number) => `seed-${i}:a`

  products.forEach((p, i) => {
    const restock = p.restockAt !== undefined || before[i] === 0
    const opening = restock ? before[i] : before[i] + after[i] + p.remaining
    const t = at(HISTORY_DAYS + 5 - i * 0.2, 10)
    step(t, {
      type: "article/create",
      nonce: `seed-${i}`,
      at: t,
      quantity: opening,
      input: { name: p.name, category: p.category, sku: p.sku, note: "", purchasePrice: p.purchasePrice, salePrice: p.salePrice },
    })
    if (restock) {
      // The morning before the first "after" sale, so it is always in time.
      const r = at(RESTOCK_DAYS_AGO + 1, 8)
      step(r, {
        type: "stock/receive",
        articleId: articleId(i),
        nonce: `seed-r${i}`,
        at: r,
        quantity: after[i] + p.remaining,
        unitPurchasePrice: p.restockAt ?? p.purchasePrice,
        note: "",
      })
    }
  })

  let returnedOne = false
  plans.forEach((plan, n) => {
    const t = at(plan.daysAgo)
    if (plan.kind === "direct") {
      step(t, {
        type: "sale/create",
        nonce: `seed-s${n}`,
        at: t,
        articleId: articleId(plan.line.product),
        quantity: plan.line.quantity,
        unitSalePrice: plan.line.unitSalePrice,
        buyer: plan.buyer,
        note: "",
      })
      return
    }
    const [city, postalCode, street] = pick(places)
    const id = `seed-p${n}:p`
    step(t, {
      type: "shipment/create",
      nonce: `seed-p${n}`,
      at: t,
      items: plan.lines.map((l) => ({ articleId: articleId(l.product), quantity: l.quantity, unitSalePrice: l.unitSalePrice })),
      details: {
        recipient: { name: person(), phone: phone(), address: `${street} ${1 + Math.floor(rand() * 120)}`, city, postalCode },
        shippingCost: rand() < 0.3 ? 450 + Math.floor(rand() * 3) * 100 : 0,
        trackingNumber: "",
        note: "",
      },
    })
    if (plan.daysAgo < 1) return // still waiting to be posted
    const sent = later(t, 0.4 + rand() * 0.6)
    step(sent, { type: "shipment/status", id, nonce: `seed-p${n}s`, at: sent, status: "sent" })
    if (plan.daysAgo < 4) return // on its way
    const end = later(sent, 1.5 + rand() * 1.5)
    // One parcel came back unclaimed; its items return to stock.
    const returned = !returnedOne && plan.daysAgo > 20 && plan.daysAgo < 60
    if (returned) returnedOne = true
    step(end, { type: "shipment/status", id, nonce: `seed-p${n}d`, at: end, status: returned ? "returned" : "delivered" })
  })

  steps.sort((a, b) => a.time.localeCompare(b.time) || a.order - b.order)
  let state = createEmptyState()
  for (const { action } of steps) {
    const result = reduce(state, action)
    // Plans are built to always fit; skip anything that would not, rather than break the demo.
    if (result.ok) state = result.state
  }

  // Tracking numbers on parcels that went out, like a courier would give.
  state.shipments = state.shipments.map((sh, i) =>
    sh.status === "pending" ? sh : { ...sh, trackingNumber: `RS${String(48213077 + i * 7919).padStart(9, "0")}SR` },
  )
  return state
}
