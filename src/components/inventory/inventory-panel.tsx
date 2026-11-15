"use client"

import { PackageOpenIcon, PackagePlusIcon, PlusIcon, SearchXIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Panel } from "@/components/app/panel"
import { PanelSkeleton } from "@/components/app/skeleton"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/content/types"
import { fill } from "@/lib/format"
import { categoriesOf, piecesInShipments } from "@/lib/inventory/selectors"
import { inventory, useInventory } from "@/lib/inventory/store"
import type { Article, Id } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { AdjustDialog } from "./adjust-dialog"
import type { ArticleAction } from "./article-actions"
import { ArticleCards } from "./article-cards"
import { ArticleFormDialog } from "./article-form-dialog"
import { ArticleTable } from "./article-table"
import { applyFilters, facetCounts, initialFilters, totalsOf, type Filters } from "./filters"
import { HistoryDialog } from "./history-dialog"
import { InventorySummary } from "./inventory-summary"
import { InventoryToolbar } from "./inventory-toolbar"
import { ReceiveDialog } from "./receive-dialog"
import { SellDialog } from "./sell-dialog"

type DialogKind = "create" | ArticleAction
/** `kind`/`id` stay set after closing, so the dialog keeps its content while it animates out. */
type DialogState = { kind: DialogKind; id: Id | null; name: string; open: boolean }

const FLASH_MS = 1600

export function InventoryPanel({ dict }: { dict: Dictionary["inventory"] }) {
  const { t, locale } = useApp()
  const state = useInventory()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [dialog, setDialog] = useState<DialogState>({ kind: "create", id: null, name: "", open: false })
  // The row that just changed, briefly highlighted so the eye finds it.
  const [flash, setFlash] = useState<Id | null>(null)

  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(null), FLASH_MS)
    return () => clearTimeout(timer)
  }, [flash])

  const openDialog = (kind: DialogKind, article?: Article) =>
    setDialog({ kind, id: article?.id ?? null, name: article?.name ?? "", open: true })
  const dialogProps = (kind: DialogKind) => ({
    open: dialog.open && dialog.kind === kind,
    onOpenChange: (open: boolean) => setDialog((d) => ({ ...d, open })),
  })
  const onAction = (action: ArticleAction, article: Article) => openDialog(action, article)

  const hasArticles = !!state && state.articles.length > 0
  const actions = (
    <>
      <Button
        variant="outline"
        size="cta"
        className="rounded-full"
        disabled={!hasArticles}
        onClick={() => openDialog("receive")}
      >
        <PackagePlusIcon data-icon="inline-start" aria-hidden />
        {dict.actions.receive}
      </Button>
      <Button variant="brand" size="cta" disabled={!state} onClick={() => openDialog("create")}>
        <PlusIcon data-icon="inline-start" aria-hidden />
        {dict.actions.newArticle}
      </Button>
    </>
  )

  if (!state) {
    return (
      <>
        <PageHeader title={dict.title} subtitle={dict.subtitle} actions={actions} />
        <PanelSkeleton label={t.loading} />
      </>
    )
  }

  const articles = state.articles
  const target = dialog.id ? articles.find((a) => a.id === dialog.id) : undefined
  const shipped = piecesInShipments(state)
  const categories = categoriesOf(state, locale).filter((c) => articles.some((a) => a.category === c))
  const rows = applyFilters(articles, filters, locale)
  const counts = facetCounts(articles, filters)

  function remove(article: Article) {
    const result = inventory.deleteArticle(article.id)
    if (!result.ok) toast(t.errors[result.error], { tone: "error" })
    else toast(dict.delete.done)
  }

  return (
    <>
      <PageHeader title={dict.title} subtitle={dict.subtitle} actions={actions} />

      <div className="flex flex-col gap-6">
        <InventorySummary
          totals={totalsOf(articles)}
          piecesInShipments={[...shipped.values()].reduce((sum, n) => sum + n, 0)}
          dict={dict}
        />

        {hasArticles ? (
          <>
            <InventoryToolbar
              filters={filters}
              onChange={setFilters}
              categories={{ names: categories, hasUncategorized: articles.some((a) => !a.category) }}
              counts={counts}
              shown={rows.length}
              dict={dict}
            />
            {rows.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={SearchXIcon}
                  title={dict.empty.noMatchTitle}
                  description={dict.empty.noMatchDescription}
                  action={
                    <Button
                      variant="outline"
                      size="cta"
                      className="rounded-full"
                      onClick={() => setFilters({ ...initialFilters, sort: filters.sort })}
                    >
                      {dict.toolbar.clearFilters}
                    </Button>
                  }
                />
              </Panel>
            ) : (
              <>
                <Panel className="hidden overflow-hidden lg:block">
                  <ArticleTable
                    rows={rows}
                    totals={totalsOf(rows)}
                    inShipments={shipped}
                    flash={flash}
                    dict={dict}
                    onAction={onAction}
                  />
                </Panel>
                <div className="lg:hidden">
                  <ArticleCards
                    rows={rows}
                    totals={totalsOf(rows)}
                    inShipments={shipped}
                    flash={flash}
                    dict={dict}
                    onAction={onAction}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <Panel>
            <EmptyState
              icon={PackageOpenIcon}
              title={dict.empty.title}
              description={dict.empty.description}
              action={
                <Button variant="brand" size="cta" onClick={() => openDialog("create")}>
                  <PlusIcon data-icon="inline-start" aria-hidden />
                  {dict.actions.newArticle}
                </Button>
              }
            />
          </Panel>
        )}
      </div>

      <ArticleFormDialog
        {...dialogProps("create")}
        categories={categories}
        dict={dict}
        onSaved={setFlash}
      />
      <ArticleFormDialog
        {...dialogProps("edit")}
        open={dialog.open && dialog.kind === "edit" && !!target}
        article={target}
        categories={categories}
        dict={dict}
        onSaved={setFlash}
      />
      <ReceiveDialog {...dialogProps("receive")} articles={articles} articleId={dialog.id} dict={dict} onSaved={setFlash} />
      <SellDialog {...dialogProps("sell")} article={target} dict={dict} onSaved={setFlash} />
      <AdjustDialog {...dialogProps("adjust")} article={target} dict={dict} onSaved={setFlash} />
      <HistoryDialog {...dialogProps("history")} article={target} state={state} dict={dict} />
      <ConfirmDialog
        {...dialogProps("delete")}
        title={fill(dict.delete.title, { name: dialog.name })}
        description={dict.delete.description}
        confirmLabel={t.actions.delete}
        onConfirm={() => target && remove(target)}
      />
    </>
  )
}
