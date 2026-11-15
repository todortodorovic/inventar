@AGENTS.md

# Inventar — conventions

Demo inventory app (stock, receiving, search, sales, shipments, profit stats).
Stack and look are Catena's (`../catena`): Next.js 16 App Router with Cache
Components and the React Compiler, Tailwind CSS 4, shadcn/ui (base-nova, on
Base UI), lucide icons, pnpm. Serbian at `/…`, English at `/en/…`.

## Data

- No backend. All data is in `src/lib/inventory/`, kept in the tab's
  sessionStorage. Components read it with `useInventory()` (null until the
  browser copy is read, so render `<PanelSkeleton>` first) and change it only
  through `inventory.*` in `store.ts`, which returns `{ ok } | { ok: false, error }`.
  Show errors with `toast(t.errors[error], { tone: "error" })`.
- Business rules live in `reducer.ts` (pure). Derived numbers (profit, margin,
  stock value, pieces in shipments, search matching) live in `selectors.ts`;
  use them instead of re-deriving, so every panel agrees.
- Money is whole units of `siteConfig.currency` (RSD). Format with
  `formatMoney`, `formatPercent`, `formatDate`, `plural`… from `@/lib/format`.

## UI

- Pages (`src/app/[lang]/…/page.tsx`) are static server components that load
  the dictionary and render one client panel (`src/components/<section>/`).
- Copy lives in `src/content/dictionaries/{sr,en}/<section>.ts`. Serbian is the
  source of truth (`Dictionary = typeof sr`); English must match its shape.
  Shared words (statuses, units, errors, field names) are in `common`, read in
  client components with `useApp()` → `{ locale, t }`.
- Building blocks in `src/components/app/`: `PageHeader`, `Panel`/`PanelHeader`,
  `StatTile`, `Field`, `SearchInput`, `ChipGroup`, `ShipmentStatusBadge`/
  `StockBadge`/`ChannelBadge`, `EmptyState`, `ConfirmDialog`, `PanelSkeleton`.
  UI primitives in `src/components/ui/` (`Button`, `Input`, `NativeSelect`,
  `Textarea`, `Dialog`, `Table`…).
- Primary action of a page or dialog: `<Button variant="brand" size="cta">`
  (dark pill with the pink lip). Secondary: `variant="outline"`/`"ghost"`
  with `size="cta" className="rounded-full"`.
- Look: cream background, white 24px cards (`rounded-(--radius-card)`,
  `border-line`), Bricolage (`font-display`) for headings and big numbers
  with tight negative tracking, Geist Mono uppercase 11px labels, `tabular-nums`
  for figures, `text-gain`/`text-loss` for profit. Colours only via tokens in
  `globals.css`. Must work at 390px wide (no horizontal scroll) and with the
  keyboard.
