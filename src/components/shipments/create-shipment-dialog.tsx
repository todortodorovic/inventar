"use client"

import { useId, useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Dictionary } from "@/content/types"
import { formatMoney, formatNumber, parseAmount } from "@/lib/format"
import { inventory } from "@/lib/inventory/store"
import type { Article, Id } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import {
  DeliveryFields,
  emptyDraft,
  FormSection,
  RecipientFields,
  validateDetails,
  type DetailsDraft,
  type DetailsErrors,
} from "./details-fields"
import { ItemPicker, lineFor, type Line } from "./item-picker"

/**
 * New parcel: recipient, articles off the shelf, postage. Mount it with a
 * fresh `key` each time it opens so the form starts empty (or with
 * `initialArticleId` already in it, for links from the stock page).
 */
export function CreateShipmentDialog({
  open,
  onOpenChange,
  articles,
  initialArticleId,
  onCreated,
  dict,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  articles: Article[]
  initialArticleId?: Id
  onCreated: (id: Id) => void
  dict: Dictionary["shipments"]
}) {
  const { locale, t } = useApp()
  const idPrefix = useId()
  const [draft, setDraft] = useState<DetailsDraft>(emptyDraft)
  const [errors, setErrors] = useState<DetailsErrors>({})
  const [lines, setLines] = useState<Line[]>(() => {
    const article = articles.find((a) => a.id === initialArticleId && a.quantity > 0)
    return article ? [lineFor(article)] : []
  })
  const [itemsError, setItemsError] = useState<string>()
  const [priceErrors, setPriceErrors] = useState<Record<Id, string>>({})

  const change = (key: keyof DetailsDraft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      const next = { ...e }
      delete next[key]
      return next
    })
  }
  const changeLines = (next: Line[]) => {
    setLines(next)
    setItemsError(undefined)
    setPriceErrors({})
  }

  // Live summary; anything not yet a valid number counts as 0.
  const purchase = (id: Id) => articles.find((a) => a.id === id)?.purchasePrice ?? 0
  const pieces = lines.reduce((sum, l) => sum + l.quantity, 0)
  const cod = lines.reduce((sum, l) => sum + (parseAmount(l.price) ?? 0) * l.quantity, 0)
  const cost = lines.reduce((sum, l) => sum + purchase(l.articleId) * l.quantity, 0)
  const shipping = parseAmount(draft.shippingCost) ?? 0
  const profit = cod - cost - shipping

  const submit = () => {
    const { details, errors: found } = validateDetails(draft, {
      required: t.validation.required,
      wholeNumber: t.validation.wholeNumber,
      phone: dict.validation.phone,
    })
    const badPrices: Record<Id, string> = {}
    for (const l of lines) if (parseAmount(l.price) === null) badPrices[l.articleId] = t.validation.wholeNumber
    const noItems = lines.length === 0

    setErrors(found)
    setPriceErrors(badPrices)
    setItemsError(noItems ? dict.validation.noItems : undefined)
    if (!details || noItems || Object.keys(badPrices).length > 0) return

    const result = inventory.createShipment(
      details,
      lines.map((l) => ({ articleId: l.articleId, quantity: l.quantity, unitSalePrice: parseAmount(l.price)! })),
    )
    if (!result.ok) {
      toast(t.errors[result.error], { tone: "error" })
      return
    }
    onOpenChange(false)
    onCreated(result.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dict.form.createTitle}</DialogTitle>
          <DialogDescription>{dict.form.createDescription}</DialogDescription>
        </DialogHeader>

        <form
          noValidate
          className="flex min-w-0 flex-col gap-7"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <RecipientFields idPrefix={idPrefix} draft={draft} errors={errors} onChange={change} dict={dict.form} />

          <FormSection title={dict.form.items}>
            <ItemPicker
              idPrefix={idPrefix}
              articles={articles}
              lines={lines}
              onChange={changeLines}
              error={itemsError}
              priceErrors={priceErrors}
              dict={dict.form}
            />
          </FormSection>

          <DeliveryFields idPrefix={idPrefix} draft={draft} errors={errors} onChange={change} dict={dict.form} />

          <section aria-label={dict.form.summary} className="rounded-2xl bg-sand px-4 py-4 sm:px-5">
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-ink-muted">{dict.form.pieces}</dt>
              <dd className="text-right tabular-nums">{formatNumber(pieces, locale)}</dd>
              <dt className="text-ink-muted">{t.fields.cost}</dt>
              <dd className="text-right tabular-nums">{formatMoney(cost, locale)}</dd>
              <dt className="text-ink-muted">{dict.form.shipping}</dt>
              <dd className="text-right tabular-nums">{formatMoney(shipping, locale)}</dd>
              <dt className="text-ink-muted">{t.fields.expectedProfit}</dt>
              <dd className={cn("text-right font-semibold tabular-nums", profit < 0 ? "text-loss" : "text-gain")}>
                {formatMoney(profit, locale)}
              </dd>
            </dl>
            <div className="mt-3.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t border-line-strong pt-3.5">
              <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">
                {dict.form.cod}
              </span>
              <output
                aria-live="polite"
                className="font-display text-[32px] leading-none font-bold tracking-[-0.04em] tabular-nums"
              >
                {formatMoney(cod, locale)}
              </output>
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="ghost" size="cta" className="rounded-full" onClick={() => onOpenChange(false)}>
              {t.actions.cancel}
            </Button>
            <Button type="submit" variant="brand" size="cta">
              {dict.form.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
