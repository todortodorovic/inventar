"use client"

import { MinusIcon, PlusIcon, TriangleAlertIcon } from "lucide-react"
import { useId, useState, type FormEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { Field } from "@/components/app/field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatPercent, formatSigned, parseAmount, plural, toDateInput } from "@/lib/format"
import { marginOf } from "@/lib/inventory/selectors"
import { inventory } from "@/lib/inventory/store"
import type { Article, Id } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { ArticlePicker } from "./article-picker"
import { profitText } from "@/components/app/money"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Every article; the picker offers the ones with pieces on the shelf. */
  articles: Article[]
  dict: Dictionary["sales"]
  /** Called once the sale is recorded. */
  onSold: (sale: { id: Id; article: Article; quantity: number; date: string }) => void
}

/** "Nova prodaja": a direct sale from stock, with a live revenue/profit preview. */
export function NewSaleDialog({ open, onOpenChange, ...props }: Props) {
  const { t } = useApp()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-xl">
        {/* The form mounts with the popup, so every opening starts fresh. */}
        <NewSaleForm {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function NewSaleForm({ articles, dict, onSold, onClose }: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { t, locale } = useApp()
  const d = dict.dialog
  const id = useId()
  const [today] = useState(() => toDateInput(new Date().toISOString()))

  const [articleId, setArticleId] = useState<Id | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")
  const [buyer, setBuyer] = useState("")
  const [date, setDate] = useState(today)
  const [note, setNote] = useState("")
  const [showErrors, setShowErrors] = useState(false)

  const inStock = articles.filter((a) => a.quantity > 0)
  const article = inStock.find((a) => a.id === articleId) ?? null
  const onHand = article?.quantity ?? 0

  const qty = parseAmount(quantity)
  const unitPrice = parseAmount(price)

  const errors = {
    article: article ? null : d.pickArticle,
    quantity: !quantity.trim()
      ? t.validation.required
      : qty === null
        ? t.validation.wholeNumber
        : qty < 1
          ? fill(t.validation.min, { min: 1 })
          : article && qty > onHand
            ? fill(t.validation.max, { max: onHand })
            : null,
    price: !price.trim() ? t.validation.required : unitPrice === null ? t.validation.wholeNumber : null,
    date: !date ? t.validation.required : date > today ? d.future : null,
  }
  const valid = Object.values(errors).every((e) => e === null)
  const shown = (key: keyof typeof errors) => (showErrors ? errors[key] : null)

  function pick(next: Article) {
    setArticleId(next.id)
    setPrice(String(next.salePrice))
    // Keep the typed quantity when it still fits the new article's stock.
    const n = parseAmount(quantity)
    if (n === null || n < 1 || n > next.quantity) setQuantity("1")
  }

  function step(delta: number) {
    const n = (qty ?? 0) + delta
    setQuantity(String(Math.min(Math.max(n, 1), Math.max(onHand, 1))))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setShowErrors(true)
    if (!valid || !article || qty === null || unitPrice === null) return
    // Today keeps the current time; an earlier day is booked at noon, so it never slips across midnight.
    const [y, m, day] = date.split("-").map(Number)
    const when = date === today ? new Date() : new Date(y, m - 1, day, 12)
    const iso = when.toISOString()
    const result = inventory.sell({ articleId: article.id, quantity: qty, unitSalePrice: unitPrice, buyer, note, date: iso })
    if (!result.ok) {
      toast(t.errors[result.error], { tone: "error" })
      return
    }
    onSold({ id: result.id, article, quantity: qty, date: iso })
    onClose()
  }

  const preview =
    article && qty !== null && qty >= 1 && unitPrice !== null
      ? (() => {
          const revenue = unitPrice * qty
          const cost = article.purchasePrice * qty
          return { revenue, cost, profit: revenue - cost, margin: marginOf(unitPrice, article.purchasePrice) }
        })()
      : null

  return (
    <form onSubmit={submit} noValidate className="contents">
      <DialogHeader>
        <DialogTitle>{d.title}</DialogTitle>
        <DialogDescription>{d.description}</DialogDescription>
      </DialogHeader>

      <ArticlePicker
        articles={inStock}
        selectedId={articleId}
        onSelect={pick}
        error={shown("article")}
        dict={d}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.fields.quantity}
          htmlFor={`${id}-qty`}
          error={shown("quantity")}
          hint={article && fill(d.maxHint, { pieces: plural(t.units.pieces, onHand, locale) })}
        >
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 md:size-9"
              aria-label={d.decrease}
              disabled={!article || (qty ?? 0) <= 1}
              onClick={() => step(-1)}
            >
              <MinusIcon />
            </Button>
            <Input
              id={`${id}-qty`}
              inputMode="numeric"
              autoComplete="off"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              aria-invalid={!!shown("quantity")}
              className="w-0 flex-1 text-center font-semibold tabular-nums"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 md:size-9"
              aria-label={d.increase}
              disabled={!article || (qty ?? 0) >= onHand}
              onClick={() => step(1)}
            >
              <PlusIcon />
            </Button>
          </div>
        </Field>

        <Field
          label={d.unitPrice}
          htmlFor={`${id}-price`}
          error={shown("price")}
          hint={article && fill(d.priceHint, { price: formatMoney(article.salePrice, locale) })}
        >
          <Input
            id={`${id}-price`}
            inputMode="numeric"
            autoComplete="off"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={!!shown("price")}
            className="tabular-nums"
          />
        </Field>

        <Field label={t.fields.buyer} htmlFor={`${id}-buyer`}>
          <Input
            id={`${id}-buyer`}
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            placeholder={d.buyerPlaceholder}
            autoComplete="off"
          />
        </Field>

        <Field label={t.fields.date} htmlFor={`${id}-date`} error={shown("date")}>
          <Input
            id={`${id}-date`}
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!shown("date")}
          />
        </Field>

        <Field label={t.fields.note} htmlFor={`${id}-note`} className="sm:col-span-2">
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={d.notePlaceholder}
            rows={2}
          />
        </Field>
      </div>

      {preview && (
        <section aria-label={d.preview} aria-live="polite" className="rounded-lg border border-hairline bg-sunken p-4">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="type-label">{t.fields.profit}</p>
              <p
                className={cn(
                  "mt-1 type-figure",
                  profitText(preview.profit),
                )}
              >
                {formatSigned(preview.profit, locale)}
              </p>
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                [t.fields.revenue, formatMoney(preview.revenue, locale)],
                [t.fields.cost, formatMoney(preview.cost, locale)],
                [t.fields.margin, preview.margin === null ? dict.stats.marginNone : formatPercent(preview.margin, locale)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="type-label">{label}</dt>
                  <dd className="text-[13.5px] font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {preview.profit < 0 && (
            <p className="mt-3 flex items-center gap-2 border-t border-hairline pt-3 text-[13px] text-status-pending-ink">
              <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
              {d.belowCost}
            </p>
          )}
        </section>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" size="cta" onClick={onClose}>
          {t.actions.cancel}
        </Button>
        <Button type="submit" variant="primary" size="cta" disabled={inStock.length === 0}>
          {d.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
