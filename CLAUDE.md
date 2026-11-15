@AGENTS.md

# Inventar — conventions

Demo inventory app (stock, receiving, search, sales, shipments, profit stats).
Stack: Next.js 16 App Router with Cache
Components and the React Compiler, Tailwind CSS 4, shadcn/ui (base-nova, on
Base UI), lucide icons, pnpm. Serbian at `/…`, English at `/en/…`.

## Data

- No backend. All data is in `src/lib/inventory/`, kept in the tab's
  sessionStorage. Components read it with `useInventory()` (null until the
  browser copy is read, so render `<PanelSkeleton>` first) and change it only
  through `inventory.*` in `store.ts`, which returns `{ ok } | { ok: false, error }`.
  Show errors with `toast(t.errors[error], { tone: "error" })`. To move to a
  real database, change only `store.ts` (`load`/`persist`/`dispatch`).
- Business rules live in `reducer.ts` (pure). Derived numbers (profit, margin,
  stock value, pieces in shipments, search matching) live in `selectors.ts`;
  use them instead of re-deriving, so every panel agrees.
- Money is whole units of `siteConfig.currency` (RSD). Format with
  `formatMoney`, `formatPercent`, `formatDate`, `plural`… from `@/lib/format`.

## UI

- Pages (`src/app/[lang]/…/page.tsx`) are static server components that load
  the dictionary and render one client panel (`src/components/<section>/`).
  Unknown paths render `[lang]/not-found.tsx` inside the shell (via
  `[lang]/[...rest]`).
- Copy lives in `src/content/dictionaries/{sr,en}/<section>.ts`. Serbian is the
  source of truth (`Dictionary = typeof sr`); English must match its shape.
  Shared words (statuses, units, errors, field names) are in `common`, read in
  client components with `useApp()` → `{ locale, t }`.
- Building blocks in `src/components/app/`: `PageHeader` (title + one line +
  actions; the same on every section), `Panel`/`PanelHeader`, `StatTile`,
  `Field`, `SearchInput`, `ChipGroup`, `ShipmentStatusBadge`/`StockBadge`/
  `ChannelBadge` (pass `code` to show a shipment code inside the sky chip),
  `EmptyState`, `ConfirmDialog`, `PanelSkeleton`, and `profitText(n)` (money.ts)
  for the colour of any profit/loss figure. UI primitives in
  `src/components/ui/` (`Button`, `Input`, `NativeSelect`, `Textarea`,
  `Dialog`, `Table`, `Menu`…).
- Buttons (`size="cta"` for page and dialog actions; `dark` is the default
  variant):
  - `variant="primary"` — LIME fill, near-black text, darker lime on hover and
    pressed. Only the page-level call to action (Novi artikal, Nova pošiljka,
    Nova prodaja) and a dialog's confirm. One per view; never a wall of lime —
    an empty state repeating the page CTA uses `dark`.
  - `variant="dark"` — graphite fill, white text: the primary action INSIDE a
    card or row (Pošalji / Leglo on a shipment card, Prodaj on an article card).
  - `variant="outline"` / `"ghost"` for secondary, `"destructive"` (soft red)
    for deleting.
- "⋯" menus use `Menu`/`MenuTrigger`/`MenuContent`/`MenuItem` from
  `ui/menu.tsx`: every item has an icon AND its name, deleting/cancelling items
  are `variant="destructive"` after a `MenuSeparator`. Items that open a dialog
  go through `useAfterMenuCloses` so focus returns to ⋯ when the dialog closes.
- Card patterns:
  - Article card (phones): name, stock + badge on one line, ⋯ menu in the
    corner, and a full-width 50/50 pair Prodaj (`dark`) / Prijem (`outline`),
    44px tall; with 0 in stock Prijem turns `dark` and Prodaj is a disabled
    `outline`. Desktop table rows: only Prodaj (`outline`) + ⋯ (Prijem first
    in the menu); with 0 in stock the inline button is Prijem and the menu
    drops it.
  - Shipment card: a meta bar tinted ~7% in the status colour (code, status
    chip, age); a fixed money block; one footer action bar with the `dark`
    next step + an `outline` secondary, icon actions and a labelled ⋯ menu.
    On narrow cards (< 380px) the two main actions sit 50/50 next to ⋯.

### Design system — graphite + lime

- Base: cool light-grey canvas (`bg-canvas`), white cards with a hairline and
  a breath of shadow (`Panel`: `rounded-(--radius-card) border-hairline
  shadow-card`), radii 8px (fields/buttons) / 12px (cards) / 14px (dialogs).
  Inter for everything (`--font-inter`) on a strict scale: `type-title`,
  `type-heading`, `type-figure` (big figures: tighter tracking), `type-label`,
  `type-overline`. `tabular-nums` on every number. Codes (SKU, shipment code,
  tracking number) use `font-code` = JetBrains Mono (latin-ext), set about 1px
  smaller than the Inter beside them. Sticky table heads and day headers.
  Dialogs: a footer bar that stays put (`DialogFooter`); on phones the dialog
  is a bottom sheet with a grab handle.
- Shell: a dark GRAPHITE sidebar on desktop (`bg-sidebar`, steps
  `sidebar-raised` / `sidebar-active`, text `sidebar-fg` / `-muted` / `-faint`,
  all ≥ 4.5:1) with the logo, the four sections with live counts, and Demo +
  SR/EN at the bottom. The active section: raised graphite chip, lime bar on
  its left edge, lime icon. Phones: a light frosted top bar (`--topbar-h`) with
  the logo, Demo and SR/EN, and a solid white bottom tab bar (`--tabbar-h`)
  whose active tab is a graphite pill with a lime icon.
- Logo: an isometric box with a lime lid (graphite sides on light, light sides
  on graphite: `<Logo tone="dark">` in the sidebar) and the wordmark
  "inventar" in Inter semibold; `src/app/icon.svg` is the same mark on a
  graphite tile.
- LIME (`accent`, `#c6f432`) is the brand and is used ONLY for: the logo
  mark, the active nav state, page-level primary buttons, the selected-period
  band in charts (`chart-band`) and selection highlights (`accent-soft`, with
  `accent-ink` text and `accent-edge` borders). Lime is never text on white
  and never profit. Text on lime is `text-accent-fg`.
- Graphite (`graphite-950…700`): the sidebar, `dark` buttons, toasts, the
  default focus ring.
- Money: `text-gain` (deep green) for profit, `text-loss` (red) for loss, muted
  for zero — always via `profitText(n)` (a `StatTile` gets `tone="gain"` only above
  0, `"loss"` only below); identical in tables, tiles, charts (`chart-2` = gain) and legends.
  Revenue is quiet slate (`chart-1`). Overview phone tiles may go compact
  ("276,5 hilj. RSD" / "RSD 276.5k"), but a whole row at once: `Money compact`
  + `compactRow(...)` in `overview/figures.tsx`.
- Shipment statuses (soft fill + strong ink + dot, via `ShipmentStatusBadge`
  or `statusClass`): za slanje = amber `status-pending`, poslato = sky
  `status-sent`, leglo = green `status-delivered`, vraćeno = red
  `status-returned`. Stock (`StockBadge`): ok = green, pri kraju = amber,
  nema na stanju = solid red `danger` (the only solid chip: most urgent).
  Count badges for "to send" use amber `bg-status-pending text-graphite-950`.
- `StatTile`: `accent` = the small key before the label (series colour, e.g.
  `var(--chart-1)` revenue, `var(--chart-2)` profit); `edge="var(--status-…)"`
  = a 3px top edge, only for status or stock state (shipment tiles, the
  overview stock row); `tone="gain" | "loss"` colours the figure.
- Focus: a visible 2px graphite outline with 2px offset on light surfaces
  (`focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-ring`); lime (`outline-accent-on-dark`) on graphite.
  Pairing it with `outline-none` is fine: globals.css restores the solid
  style on `:focus-visible` (Tailwind 4's `outline-none` would otherwise
  zero it). The layout's first tab stop is a "skip to content" link to `#main`.
- `ChipGroup` (segmented control) never widens the page: on narrow screens it
  scrolls sideways with faded edges. Its segments are 40px touch targets on
  phones; on md+ the control is 36px, the height of a field. It is a radio
  group: one tab stop, arrow keys / Home / End change the choice.
- `Field` gives its hint/error an id and `Input`/`Textarea`/`NativeSelect`
  inside it point `aria-describedby` at it (via `useDescribedBy` for anything
  custom). Toasts: at most three; plain ones 4s, ones with an action (Undo)
  10s, paused on hover/focus, reachable with Alt+T, closed with Escape.
  Form previews (`Preview` in `inventory/form-bits.tsx`) are not live
  regions; pass one `announce` string instead.
- When an action removes or disables the focused control (last piece sold,
  row deleted, shipment status moved, sale undone), the panel moves focus to
  the neighbouring row's/card's action (`data-article-actions`,
  `data-shipment-id` + `data-card-focus`, `data-sale-action`), never `<body>`.
- Text colours: `fg`, `fg-soft`, `fg-muted`, `fg-faint`; wells inside cards:
  `bg-sunken`. Colours only via tokens in `globals.css` (the full list with
  purposes is there). Must work at 390px wide (no horizontal scroll) and with
  the keyboard.
