"use client"

import { DownloadIcon, PlusIcon, ReceiptTextIcon, SearchXIcon } from "lucide-react"
import { useState, type ReactNode } from "react"
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
import { inRange, periodRange, periods, type Period } from "./period"
import { SaleList } from "./sale-list"
import { SalesStats } from "./sales-stats"

type ChannelFilter = "all" | SaleChannel

// Chips are 32px tall by default; on phones they need a 40px target.
const touchChips = "self-start max-md:[&>button]:min-h-10"

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

  const header = (actions?: ReactNode) => (
    <PageHeader eyebrow={dict.eyebrow} title={dict.title} subtitle={dict.subtitle} actions={actions} />
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

  const newSaleButton = (
    <Button variant="brand" size="cta" onClick={() => setNewOpen(true)}>
      <PlusIcon data-icon="inline-start" />
      {dict.newSale}
    </Button>
  )

  const undoingArticleExists = !!undoing && state.articles.some((a) => a.id === undoing.articleId)

  return (
    <>
      {header(
        <>
          {state.sales.length > 0 && (
            <Button variant="outline" size="cta" className="rounded-full" onClick={exportCsv}>
              <DownloadIcon data-icon="inline-start" />
              {dict.exportCsv}
            </Button>
          )}
          {newSaleButton}
        </>,
      )}

      {state.sales.length === 0 ? (
        <Panel>
          <EmptyState
            icon={ReceiptTextIcon}
            title={dict.empty.title}
            description={dict.empty.description}
            action={newSaleButton}
          />
        </Panel>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <ChipGroup
                label={dict.filters.period}
                value={period}
                onChange={setPeriod}
                options={periods.map((p) => ({ value: p, label: dict.filters.periods[p] }))}
                className={touchChips}
              />
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={dict.filters.search}
                clearLabel={t.actions.clearSearch}
                className="lg:w-[340px]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
                className={touchChips}
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
          </div>

          <SalesStats sales={shown} dict={dict} />

          {shown.length === 0 ? (
            <Panel>
              <EmptyState
                icon={SearchXIcon}
                title={dict.empty.filteredTitle}
                description={query ? t.filters.noResults : dict.empty.filteredDescription}
                action={
                  period === "all" ? (
                    <Button variant="outline" size="cta" className="rounded-full" onClick={resetFilters}>
                      {dict.filters.clear}
                    </Button>
                  ) : (
                    <Button variant="outline" size="cta" className="rounded-full" onClick={() => setPeriod("all")}>
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
        onConfirm={() => undoing && undo(undoing.id)}
      />
    </>
  )
}
