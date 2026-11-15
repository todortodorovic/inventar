# Inventar

A small inventory app for a one-person shop that sells from stock and ships
cash-on-delivery parcels. It tracks stock, receiving, direct sales, shipments
and profit. Next.js 16 (App Router, Cache Components, React Compiler),
Tailwind CSS 4 and shadcn/ui on Base UI. Serbian at `/`, English at `/en`.

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # every section prerenders to static HTML in both languages
pnpm start    # serve the build
pnpm lint
pnpm exec tsc --noEmit
```

## What it does

- **Pregled (Overview):** revenue, net profit (after postage), margin and
  pieces sold for 7 days, 30 days, 3 or 12 months, or all time, each compared
  with the previous period. It also shows current stock value and expected
  profit, a monthly revenue/profit chart (also as a table), profit by
  category, the top articles, the shipment pipeline, what needs restocking
  and recent activity.
- **Stanje (Stock):** articles with cost, price, margin and expected profit.
  Search, stock and category filters, and sorting. From here you add articles,
  receive stock (prijem, which re-averages the cost), sell, correct a count
  (popis), view each article's movement history, and edit or delete articles.
- **Pošiljke (Shipments):** pack a parcel from stock (several articles, each
  at its own price, plus the postage you pay), then move it through Za
  slanje → Poslato → Leglo (delivered and paid) or Vraćeno (returned). Each
  step can be undone. Leglo turns the parcel's items into sales, and Vraćeno
  or cancelling puts the pieces back on the shelf.
- **Prodato (Sold):** every sale, direct or from a shipment, grouped by day,
  with revenue, cost, profit and margin for the chosen period. Filter by
  channel, category or text, export to CSV, and undo direct sales.

Most actions show a toast with **Poništi** (Undo) for 10 seconds. Alt+T moves
focus to it.

## Customising

| To change…                                                       | Edit                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Any text, in either language                                     | `src/content/dictionaries/{sr,en}/<section>.ts` (shared words in `common.ts`) |
| Colours, radii, shadows, type scale                              | `src/app/globals.css` → "Design tokens"                                       |
| Typefaces (Inter, JetBrains Mono for codes)                      | `src/app/fonts.ts`                                                            |
| App name, URL, languages, currency, low-stock limit, storage key | `src/config/site.ts`                                                          |
| Section order and URLs                                           | `sections` / `sectionPath` in `src/config/site.ts`                            |
| Locale routing (unprefixed default language)                     | `next.config.ts` → rewrites / redirects                                       |
| Demo data (products, six months of history)                      | `src/lib/inventory/seed.ts`                                                   |
| Business rules (stock, average cost, status flow)                | `src/lib/inventory/reducer.ts`                                                |
| Derived numbers (profit, margin, stock value)                    | `src/lib/inventory/selectors.ts`                                              |
| Periods and overview statistics                                  | `src/lib/inventory/stats.ts`                                                  |
| Logo and favicon                                                 | `src/components/brand/logo.tsx`, `src/app/icon.svg`                           |

Serbian is the source of truth for copy: `Dictionary = typeof sr`, so the
compiler lists anything the English dictionary is missing. To add a
language, add it to `locales`/`localeTags` in `site.ts`, add a dictionary
folder and register it in `src/content/dictionaries/index.ts`.

Money is kept as whole units of `siteConfig.currency` (RSD by default) and
formatted with `Intl` for each locale (`src/lib/format.ts`).

## Where the data lives

There is no backend. Each browser tab gets its own copy of the demo shop,
kept in that tab's **sessionStorage** under `inventar:v1`. Reloading keeps
it, and closing the tab forgets it. Two tabs are two separate shops. The
**Demo** button restores the demo data or starts from an empty shop.

All of this goes through one file, `src/lib/inventory/store.ts`:

- `useInventory()` gives components the current state (`null` until the
  browser copy has been read, so pages render a skeleton first).
- `inventory.*` is every change the UI can make (create article, receive,
  sell, create shipment, change status…). Each returns `{ ok: true }` or
  `{ ok: false, error }`, which the UI translates via `common.errors`.
- Each change is an action run through the pure `reduce()` in `reducer.ts`,
  which refuses invalid ones (not enough stock, an impossible status change…)
  and leaves the state untouched.

**Swapping in a real database:** keep the `useInventory()` / `inventory.*`
surface and change only `store.ts`. Replace `load()` with a fetch of the
user's data and `persist()` (or `dispatch()`) with a call to your API, which
can run the same `reduce()` on the server to validate and apply the action
before saving. Actions already carry their own ids and timestamps (`nonce`,
`at`), so the server and the client produce identical records. No component
needs to change.

## Deploying

Any Node host that runs `pnpm build && pnpm start`, or Vercel. Set
`NEXT_PUBLIC_SITE_URL` to the public origin before building, because it is
the `metadataBase` for absolute URLs. Pages are marked `noindex`, since each
visitor sees only their own demo data.
