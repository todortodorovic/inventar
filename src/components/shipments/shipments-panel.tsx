"use client"

import { PackageOpenIcon, PlusIcon, SearchXIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { ChipGroup } from "@/components/app/chip-group"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Panel } from "@/components/app/panel"
import { SearchInput } from "@/components/app/search-input"
import { PanelSkeleton } from "@/components/app/skeleton"
import { Button } from "@/components/ui/button"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney } from "@/lib/format"
import { countByStatus, matches, shipmentTotal } from "@/lib/inventory/selectors"
import { useNow } from "@/lib/use-now"
import { inventory, useInventory, type DispatchResult } from "@/lib/inventory/store"
import type { Id, Shipment, ShipmentStatus } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { commandTarget, courierText, needsConfirm, type ShipmentCommand } from "./commands"
import { CreateShipmentDialog } from "./create-shipment-dialog"
import { EditShipmentDialog } from "./edit-shipment-dialog"
import { ShipmentCard } from "./shipment-card"
import { ShipmentConfirm } from "./shipment-confirm"
import { ShipmentStats } from "./shipment-stats"

type Filter = "active" | ShipmentStatus | "all"

const inFilter = (filter: Filter, status: ShipmentStatus) =>
  filter === "all" || (filter === "active" ? status === "pending" || status === "sent" : status === filter)

/**
 * Dialog state keeps a copy of the shipment it was opened for, so the text
 * stays put while the dialog animates out (even if the record is gone).
 * `session` remounts the form each time it opens.
 */
type DialogState<T> = { open: boolean; session: number } & T

export function ShipmentsPanel({ dict }: { dict: Dictionary["shipments"] }) {
  const { locale, t } = useApp()
  const state = useInventory()
  const router = useRouter()
  const now = useNow()
  const [filter, setFilter] = useState<Filter>("active")
  const [query, setQuery] = useState("")
  const [create, setCreate] = useState<DialogState<{ articleId?: Id }>>({ open: false, session: 0 })
  const [edit, setEdit] = useState<DialogState<{ shipment?: Shipment }>>({ open: false, session: 0 })
  const [confirm, setConfirm] = useState<{ open: boolean; command?: ShipmentCommand; shipment?: Shipment }>({
    open: false,
  })

  const openCreate = (articleId?: Id) => setCreate((c) => ({ open: true, session: c.session + 1, articleId }))

  // Links from the stock page arrive as `?new=<articleId>`: open the form with
  // that article in it, then drop the parameter so a reload does not reopen it.
  // Read in an effect, not during render: on a client-side navigation the URL
  // only changes once Next commits it, and static prerendering has no URL.
  const linkHandled = useRef(false)
  useEffect(() => {
    if (!state || linkHandled.current) return
    linkHandled.current = true
    const params = new URLSearchParams(window.location.search)
    const articleId = params.get("new")
    if (articleId === null) return
    params.delete("new")
    const search = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`)
    if (!state.articles.some((a) => a.id === articleId && a.quantity > 0)) {
      toast(dict.toasts.articleUnavailable, { tone: "error" })
    }
    queueMicrotask(() => openCreate(articleId))
  }, [state, dict.toasts.articleUnavailable])

  // The new shipment's code is only in the store after the dispatch re-renders
  // this panel, so the "created" toast waits for that render.
  const createdId = useRef<Id | null>(null)
  useEffect(() => {
    const id = createdId.current
    const created = id && state?.shipments.find((sh) => sh.id === id)
    if (!created) return
    createdId.current = null
    toast(fill(dict.toasts.created, { code: created.code }), {
      action: { label: t.actions.undo, onClick: () => report(inventory.deleteShipment(created.id)) },
    })
  })

  function report(result: DispatchResult) {
    if (!result.ok) toast(t.errors[result.error], { tone: "error" })
    return result.ok
  }

  const setStatus = (id: Id, status: ShipmentStatus) => report(inventory.setShipmentStatus(id, status))

  function perform(command: ShipmentCommand, sh: Shipment) {
    const to = commandTarget[command]
    const done = command === "delete" ? report(inventory.deleteShipment(sh.id)) : to ? setStatus(sh.id, to) : false
    if (!done) return
    const code = sh.code
    const undo = (back: ShipmentStatus) => ({ label: t.actions.undo, onClick: () => setStatus(sh.id, back) })
    switch (command) {
      case "send":
        return toast(fill(dict.toasts.sent, { code }), { action: undo("pending") })
      case "backToPending":
        return toast(fill(dict.toasts.backToPending, { code }), { action: undo("sent") })
      case "deliver":
        return toast(fill(dict.toasts.delivered, { code, amount: formatMoney(shipmentTotal(sh), locale) }), {
          action: { label: dict.actions.showSales, onClick: () => router.push(localePath(locale, "sales")) },
        })
      case "undeliver":
        return toast(fill(dict.toasts.undelivered, { code }), { action: undo("delivered") })
      case "return":
        return toast(fill(dict.toasts.returned, { code }))
      case "cancel":
        return toast(fill(dict.toasts.cancelled, { code }))
      case "delete":
        return toast(fill(dict.toasts.deleted, { code }))
    }
  }

  async function copy(sh: Shipment) {
    try {
      await navigator.clipboard.writeText(courierText(sh, dict.card.cod, formatMoney(shipmentTotal(sh), locale)))
      toast(dict.toasts.copied)
    } catch {
      toast(dict.toasts.copyFailed, { tone: "error" })
    }
  }

  function onCommand(command: ShipmentCommand, sh: Shipment) {
    if (command === "edit") setEdit((e) => ({ open: true, session: e.session + 1, shipment: sh }))
    else if (command === "copy") void copy(sh)
    else if (needsConfirm.has(command)) setConfirm({ open: true, command, shipment: sh })
    else perform(command, sh)
  }

  const header = (
    <PageHeader
      title={dict.title}
      subtitle={dict.subtitle}
      actions={
        <Button variant="brand" size="cta" onClick={() => openCreate()}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          {dict.newShipment}
        </Button>
      }
    />
  )

  if (!state || !now) {
    return (
      <>
        {header}
        <PanelSkeleton label={t.loading} />
      </>
    )
  }

  const counts = countByStatus(state)
  const statuses: ShipmentStatus[] = ["pending", "sent", "delivered", "returned"]
  const chips = [
    { value: "active" as Filter, label: dict.filters.active, count: counts.pending + counts.sent },
    ...statuses.map((s) => ({ value: s as Filter, label: t.shipmentStatus[s], count: counts[s] })),
    { value: "all" as Filter, label: t.filters.all, count: state.shipments.length },
  ]

  const visible = state.shipments
    .filter((sh) => inFilter(filter, sh.status))
    .filter((sh) => {
      const r = sh.recipient
      return matches(
        query,
        sh.code,
        r.name,
        r.phone,
        r.city,
        r.address,
        r.postalCode,
        sh.trackingNumber,
        ...sh.items.map((i) => i.articleName),
      )
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const showAll = () => {
    setFilter("all")
    setQuery("")
  }

  return (
    <>
      {header}

      <div className="flex flex-col gap-6">
        <ShipmentStats state={state} now={now} dict={dict.stats} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ChipGroup label={dict.filters.label} value={filter} onChange={setFilter} options={chips} className="min-w-0 self-start" />
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={dict.filters.search}
            clearLabel={t.actions.clearSearch}
            className="sm:max-w-[420px] lg:w-[340px] lg:shrink-0"
          />
        </div>

        {state.shipments.length === 0 ? (
          <Panel>
            <EmptyState
              icon={PackageOpenIcon}
              title={dict.empty.title}
              description={dict.empty.text}
              action={
                <Button variant="brand" size="cta" onClick={() => openCreate()}>
                  <PlusIcon data-icon="inline-start" aria-hidden />
                  {dict.newShipment}
                </Button>
              }
            />
          </Panel>
        ) : visible.length === 0 ? (
          <Panel>
            <EmptyState
              icon={filter === "active" && !query ? PackageOpenIcon : SearchXIcon}
              title={filter === "active" && !query ? dict.empty.activeTitle : dict.empty.filteredTitle}
              description={filter === "active" && !query ? dict.empty.activeText : dict.empty.filteredText}
              action={
                <Button variant="outline" size="cta" className="rounded-full" onClick={showAll}>
                  {dict.empty.showAll}
                </Button>
              }
            />
          </Panel>
        ) : (
          <section aria-label={dict.filters.list} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((sh) => (
              <ShipmentCard key={sh.id} shipment={sh} now={now} dict={dict} onCommand={onCommand} />
            ))}
          </section>
        )}
      </div>

      <CreateShipmentDialog
        key={create.session}
        open={create.open}
        onOpenChange={(open) => setCreate((c) => ({ ...c, open }))}
        articles={state.articles}
        initialArticleId={create.articleId}
        onCreated={(id) => {
          createdId.current = id
        }}
        dict={dict}
      />

      {edit.shipment && (
        <EditShipmentDialog
          key={edit.session}
          open={edit.open}
          onOpenChange={(open) => setEdit((e) => ({ ...e, open }))}
          shipment={edit.shipment}
          dict={dict}
        />
      )}

      {confirm.command && confirm.shipment && (
        <ShipmentConfirm
          open={confirm.open}
          onOpenChange={(open) => setConfirm((c) => ({ ...c, open }))}
          command={confirm.command}
          shipment={confirm.shipment}
          onConfirm={() => perform(confirm.command!, confirm.shipment!)}
          dict={dict.confirm}
        />
      )}
    </>
  )
}
