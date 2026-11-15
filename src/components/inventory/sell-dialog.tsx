"use client"

import { MinusIcon, PlusIcon } from "lucide-react"
import { useId, useState, type FormEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { Field } from "@/components/app/field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatPercent, plural, toDateInput } from "@/lib/format"
import { marginOf } from "@/lib/inventory/selectors"
import { inventory } from "@/lib/inventory/store"
import type { Article, Id } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { MoneyInput, Preview, PreviewRow, readAmount, toneOf, Warning } from "./form-bits"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | undefined
  dict: Dictionary["inventory"]
  onSaved: (id: Id) => void
}

/** A direct sale off the shelf, with an undo in the toast. */
export function SellDialog({ open, onOpenChange, article, dict, onSaved }: Props) {
  const { t } = useApp()
  return (
    <Dialog open={open && !!article} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close}>
        {article && <SellForm article={article} dict={dict} onSaved={onSaved} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function SellForm({
  article,
  dict,
  onSaved,
  onClose,
}: Omit<Props, "open" | "onOpenChange" | "article"> & { article: Article; onClose: () => void }) {
  const { t, locale } = useApp()
  const id = useId()
  const [today] = useState(() => toDateInput(new Date().toISOString()))
  const [quantityText, setQuantityText] = useState("1")
  const [priceText, setPriceText] = useState(String(article.salePrice))
  const [buyer, setBuyer] = useState("")
  const [date, setDate] = useState(today)
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const max = article.quantity
  const quantity = readAmount(quantityText, t.validation, { min: 1, max })
  const price = readAmount(priceText, t.validation)
  const dateError = !date ? t.validation.required : date > today ? dict.sell.futureDate : undefined

  const current = quantity.value ?? parseInt(quantityText, 10)
  const step = (by: number) => {
    const base = Number.isFinite(current) ? current : 1
    setQuantityText(String(Math.min(max, Math.max(1, base + by))))
  }

  const ok = quantity.value !== null && price.value !== null
  const revenue = ok ? quantity.value! * price.value! : null
  const profit = ok ? (price.value! - article.purchasePrice) * quantity.value! : null
  const margin = price.value !== null ? marginOf(price.value, article.purchasePrice) : null

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const firstInvalid = [
      ["quantity", quantity.error],
      ["price", price.error],
      ["date", dateError],
    ].find(([, error]) => error)
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid[0]}`)?.focus()
      return
    }
    // Today keeps the current time; an earlier day is recorded at noon so time zones can't move it.
    const when = date === today ? undefined : new Date(`${date}T12:00:00`).toISOString()
    const result = inventory.sell({
      articleId: article.id,
      quantity: quantity.value!,
      unitSalePrice: price.value!,
      buyer,
      note,
      date: when,
    })
    if (!result.ok) {
      toast(t.errors[result.error], { tone: "error" })
      return
    }
    toast(fill(dict.sell.done, { pieces: plural(t.units.pieces, quantity.value!, locale), name: article.name }), {
      action: {
        label: t.actions.undo,
        onClick: () => {
          const undo = inventory.undoSale(result.id)
          toast(undo.ok ? dict.sell.undone : t.errors[undo.error], { tone: undo.ok ? "default" : "error" })
        },
      },
    })
    onSaved(article.id)
    onClose()
  }

  const show = (error?: string) => (submitted ? error : undefined)

  return (
    <form noValidate onSubmit={submit} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>
          {dict.sell.title}: {article.name}
        </DialogTitle>
        <DialogDescription>
          {fill(dict.sell.onHand, { pieces: plural(t.units.pieces, article.quantity, locale) })}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.fields.quantity} htmlFor={`${id}-quantity`} error={show(quantity.error)}>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 md:size-9"
              onClick={() => step(-1)}
              disabled={current <= 1}
              aria-label={dict.sell.decrease}
            >
              <MinusIcon />
            </Button>
            <Input
              id={`${id}-quantity`}
              value={quantityText}
              onChange={(e) => setQuantityText(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              className="text-center font-semibold tabular-nums"
              aria-invalid={!!show(quantity.error)}
              aria-required
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 md:size-9"
              onClick={() => step(1)}
              disabled={current >= max}
              aria-label={dict.sell.increase}
            >
              <PlusIcon />
            </Button>
          </div>
        </Field>
        <Field label={dict.sell.unitPrice} htmlFor={`${id}-price`} error={show(price.error)}>
          <MoneyInput
            id={`${id}-price`}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            aria-invalid={!!show(price.error)}
            aria-required
          />
        </Field>
        <Field label={t.fields.buyer} htmlFor={`${id}-buyer`}>
          <Input
            id={`${id}-buyer`}
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            placeholder={dict.sell.buyerPlaceholder}
            autoComplete="off"
          />
        </Field>
        <Field label={t.fields.date} htmlFor={`${id}-date`} error={show(dateError)}>
          <Input
            id={`${id}-date`}
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!show(dateError)}
            aria-required
          />
        </Field>
        <Field label={t.fields.note} htmlFor={`${id}-note`} className="sm:col-span-2">
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={dict.sell.notePlaceholder}
            rows={2}
          />
        </Field>
      </div>

      <Preview
        title={dict.sell.preview}
        announce={profit === null ? "" : `${t.fields.profit}: ${formatMoney(profit, locale)}`}
      >
        <PreviewRow
          label={t.fields.revenue}
          value={revenue === null ? "—" : formatMoney(revenue, locale)}
          tone={revenue === null ? "muted" : "default"}
        />
        <PreviewRow
          label={t.fields.margin}
          value={margin === null ? "—" : formatPercent(margin, locale)}
          tone={margin === null ? "muted" : "default"}
        />
        <PreviewRow
          label={t.fields.profit}
          value={profit === null ? "—" : formatMoney(profit, locale)}
          tone={profit === null ? "muted" : toneOf(profit)}
          strong
        />
      </Preview>
      {price.value !== null && price.value < article.purchasePrice && <Warning>{dict.sell.belowCost}</Warning>}

      <DialogFooter>
        <Button type="button" variant="ghost" size="cta" onClick={onClose}>
          {t.actions.cancel}
        </Button>
        <Button type="submit" variant="primary" size="cta">
          {dict.sell.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
