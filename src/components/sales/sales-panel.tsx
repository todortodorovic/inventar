"use client"

import { DownloadIcon, PlusIcon, ReceiptTextIcon, SearchXIcon } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"
import { useApp } from "@/components/app/app-provider"
import { ChipGroup } from "@/components/app/chip-group"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Panel } from "@/components/app/panel"
import { SearchInput } from "@/components/app/search-input"
import { PanelSkeleton } from "@/components/app/skeleton"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import type { Dictionary } from "@/content/types"
import { fill, plural } from "@/lib/format"
import { categoriesOf, matches } from "@/lib/inventory/selectors"
import { useNow } from "@/lib/use-now"
import { inventory, useInventory } from "@/lib/inventory/store"
import type { Article, Id, Sale, SaleChannel } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { exportSalesCsv } from "./export-csv"
import { NewSaleDialog } from "./new-sale-dialog"
import { inRange, periodRange, periodShortLabel, periods, type Period } from "./period"
import { SaleList } from "./sale-list"
import { SalesStats } from "./sales-stats"

type ChannelFilter = "all" | SaleChannel

/** Prodato: every completed sale, direct or from a delivered shipment, with profit. */
export function SalesPanel({ dict }: { dict: Dictionary["sales"] }) {
  const { t, locale } = useApp()
  const state = useInventory()
  // "Now" is fixed when the page opens, so periods don't shift under the seller while they work.
  const now = useNow()
  const [period, setPeriod] = useState<Period>("month")
  const [channel, setChannel] = useState<ChannelFilter>("all")
  const [category, setCategory] = useState("")
  const [query, setQuery] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [undoing, setUndoing] = useState<Sale | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [highlightId, setHighlightId] = useState<Id | null>(null)
  const newSaleRef = useRef<HTMLButtonElement>(null)

  function undo(id: Id) {
    const result = inventory.undoSale(id)
    if (result.ok) toast(dict.undo.done)
    else toast(t.errors[result.error], { tone: "error" })
  }

  function onSold(sale: { id: Id; article: Article; quantity: number; date: string }) {
    setHighlightId(sale.id)
    // Make sure the new sale is in view, e.g. when it was booked on an earlier date.
    if (now && !inRange(sale.date, periodRange(period, now))) setPeriod("all")
    if (channel === "shipment") setChannel("all")
    toast(fill(dict.dialog.sold, { name: sale.article.name, pieces: plural(t.units.pieces, sale.quantity, locale) }), {
      action: { label: t.actions.undo, onClick: () => undo(sale.id) },
    })
  }

  function resetFilters() {
    setPeriod("all")
    setChannel("all")
    setCategory("")
    setQuery("")
  }

  // The period sits in the header, as on Pregled: it scopes the tiles and the list below.
  const periodChips = (now: Date) => (
    <ChipGroup<Period>
      label={dict.filters.period}
      value={period}
      onChange={setPeriod}
      options={periods.map((p) => ({
        value: p,
        // Short labels on phones so all six fit at 390px; the full one stays the accessible name.
        label: (
          <>
            <span className="sm:hidden" aria-hidden>
              {periodShortLabel(p, now, locale, dict.filters.periodsShort)}
            </span>
            <span className="max-sm:sr-only">{dict.filters.periods[p]}</span>
          </>
        ),
      }))}
      className="max-sm:w-full"
    />
  )

  const header = (actions?: ReactNode) => (
    <PageHeader title={dict.title} subtitle={dict.subtitle} actions={actions} />
  )

  if (!state || !now) {
    return (
      <>
        {header()}
        <PanelSkeleton label={t.loading} />
      </>
    )
  }

  const shipmentCodes = new Map(state.shipments.map((sh) => [sh.id, sh.code]))
  const range = periodRange(period, now)
  // Everything but the channel, so the channel chips can show their counts.
  const base = state.sales.filter(
    (s) =>
      inRange(s.date, range) &&
      (!category || s.category === category) &&
      matches(query, s.articleName, s.category, s.buyer, s.note, s.shipmentId && shipmentCodes.get(s.shipmentId)),
  )
  const shown = base
    .filter((s) => channel === "all" || s.channel === channel)
    .sort((a, b) => b.date.localeCompare(a.date))
  const categories = categoriesOf(state, locale)

  function exportCsv() {
    if (shown.length === 0) {
      toast(dict.nothingToExport)
      return
    }
    exportSalesCsv({ sales: shown, shipmentCodes, locale, dict: dict.csv, common: t, now: new Date() })
    toast(fill(dict.exported, { count: plural(t.units.sales, shown.length, locale) }))
  }

  // Lime only once per view: the header's CTA; the empty state repeats it in graphite.
  const newSaleButton = (variant: "primary" | "dark") => (
    <Button ref={variant === "primary" ? newSaleRef : undefined} variant={variant} size="cta" onClick={() => setNewOpen(true)}>
      <PlusIcon data-icon="inline-start" />
      {dict.newSale}
    </Button>
  )

  /**
   * Undo from the confirm dialog. Its trigger (the row's button) disappears with
   * the sale, so once the dialog has closed, focus moves to the next row's
   * action (or the previous one), else to the page's "Nova prodaja".
   */
  function confirmUndo(sale: Sale) {
    const i = shown.findIndex((s) => s.id === sale.id)
    const neighbours = [shown[i + 1], shown[i - 1]].filter(Boolean).map((s) => s.id)
    undo(sale.id)
    const target = () => {
      for (const id of neighbours) {
        for (const el of document.querySelectorAll<HTMLElement>(`[data-sale-action="${id}"]`)) {
          if (el.offsetParent) return el
        }
      }
      return newSaleRef.current
    }
    // The dialog hands focus back to its (now removed) trigger as it unmounts; take over after that.
    // (Gives up waiting after ~2s of frames.)
    const whenClosed = (frames: number) => {
      if (frames > 0 && document.querySelector('[data-slot="dialog-content"]')) requestAnimationFrame(() => whenClosed(frames - 1))
      else target()?.focus()
    }
    requestAnimationFrame(() => whenClosed(120))
  }

  const undoingArticleExists = !!undoing && state.articles.some((a) => a.id === undoing.articleId)

  return (
    <>
      {header(
        <>
          {state.sales.length > 0 && periodChips(now)}
          {state.sales.length > 0 && (
            <Button variant="outline" size="cta" onClick={exportCsv}>
              <DownloadIcon data-icon="inline-start" />
              {dict.exportCsv}
            </Button>
          )}
          {newSaleButton("primary")}
        </>,
      )}

      {state.sales.length === 0 ? (
        <Panel>
          <EmptyState
            icon={ReceiptTextIcon}
            title={dict.empty.title}
            description={dict.empty.description}
            action={newSaleButton("dark")}
          />
        </Panel>
      ) : (
        <div className="flex flex-col gap-5">
          <SalesStats sales={shown} shipments={state.shipments} dict={dict} />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <ChipGroup
                label={dict.filters.channel}
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "all", label: t.filters.all, count: base.length },
                  ...(["direct", "shipment"] as const).map((c) => ({
                    value: c,
                    label: t.saleChannel[c],
                    count: base.filter((s) => s.channel === c).length,
                  })),
                ]}
                className="self-start"
              />
              <NativeSelect
                aria-label={t.fields.category}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-[240px]"
              >
                <option value="">{t.filters.allCategories}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={dict.filters.search}
              clearLabel={t.actions.clearSearch}
              className="sm:max-w-[420px] lg:w-[340px] lg:shrink-0"
            />
          </div>

          {shown.length === 0 ? (
            <Panel>
              <EmptyState
                icon={SearchXIcon}
                title={dict.empty.filteredTitle}
                description={query ? t.filters.noResults : dict.empty.filteredDescription}
                action={
                  period === "all" ? (
                    <Button variant="outline" size="cta" onClick={resetFilters}>
                      {dict.filters.clear}
                    </Button>
                  ) : (
                    <Button variant="outline" size="cta" onClick={() => setPeriod("all")}>
                      {dict.empty.showAll}
                    </Button>
                  )
                }
              />
            </Panel>
          ) : (
            <SaleList
              key={`${period}|${channel}|${category}|${query}`}
              sales={shown}
              shipmentCodes={shipmentCodes}
              now={now}
              highlightId={highlightId}
              dict={dict.list}
              onUndo={(sale) => {
                setUndoing(sale)
                setConfirmOpen(true)
              }}
            />
          )}
        </div>
      )}

      <NewSaleDialog open={newOpen} onOpenChange={setNewOpen} articles={state.articles} dict={dict} onSold={onSold} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={dict.undo.title}
        description={
          undoing &&
          fill(undoingArticleExists ? dict.undo.description : dict.undo.deletedArticle, {
            name: undoing.articleName,
            pieces: plural(t.units.pieces, undoing.quantity, locale),
          })
        }
        confirmLabel={dict.undo.confirm}
        onConfirm={() => undoing && confirmUndo(undoing)}
      />
    </>
  )
}
