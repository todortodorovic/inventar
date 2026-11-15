"use client"

import { useId, useState, type FormEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { Field } from "@/components/app/field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, plural } from "@/lib/format"
import { inventory } from "@/lib/inventory/store"
import type { Article, Id } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { MoneyInput, Preview, PreviewRow, readAmount } from "./form-bits"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  articles: Article[]
  /** Preselected article; from the page header it is null and the first one is picked. */
  articleId: Id | null
  dict: Dictionary["inventory"]
  onSaved: (id: Id) => void
}

/** Prijem: more pieces of an article arrive, at a possibly different cost. */
export function ReceiveDialog({ open, onOpenChange, articles, articleId, dict, onSaved }: Props) {
  const { t } = useApp()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close}>
        <ReceiveForm
          articles={articles}
          articleId={articleId}
          dict={dict}
          onSaved={onSaved}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function ReceiveForm({
  articles,
  articleId,
  dict,
  onSaved,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { t, locale } = useApp()
  const id = useId()
  const sorted = [...articles].sort(
    (a, b) => a.category.localeCompare(b.category, locale) || a.name.localeCompare(b.name, locale),
  )
  const groups = new Map<string, Article[]>()
  for (const a of sorted) groups.set(a.category, [...(groups.get(a.category) ?? []), a])

  const [selectedId, setSelectedId] = useState(() => articleId ?? sorted[0]?.id ?? "")
  const article = articles.find((a) => a.id === selectedId)
  const [quantityText, setQuantityText] = useState("")
  const [priceText, setPriceText] = useState(() => (article ? String(article.purchasePrice) : ""))
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const quantity = readAmount(quantityText, t.validation, { min: 1 })
  const price = readAmount(priceText, t.validation)

  // Exactly what the reducer will store: a rounded weighted average.
  const total = article && quantity.value !== null ? article.quantity + quantity.value : null
  const average =
    article && total !== null && price.value !== null
      ? Math.round((article.quantity * article.purchasePrice + quantity.value! * price.value) / total)
      : null

  function pick(next: Id) {
    setSelectedId(next)
    const a = articles.find((x) => x.id === next)
    if (a) setPriceText(String(a.purchasePrice))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!article) return
    if (quantity.error || price.error) {
      document.getElementById(`${id}-${quantity.error ? "quantity" : "price"}`)?.focus()
      return
    }
    const result = inventory.receiveStock(article.id, quantity.value!, price.value!, note)
    if (!result.ok) {
      toast(t.errors[result.error], { tone: "error" })
      return
    }
    toast(fill(dict.receive.done, { pieces: plural(t.units.pieces, quantity.value!, locale), name: article.name }))
    onSaved(article.id)
    onClose()
  }

  const show = (error?: string) => (submitted ? error : undefined)

  return (
    <form noValidate onSubmit={submit} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{dict.receive.title}</DialogTitle>
        <DialogDescription>{dict.receive.description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.receive.article} htmlFor={`${id}-article`} className="sm:col-span-2">
          <NativeSelect id={`${id}-article`} value={selectedId} onChange={(e) => pick(e.target.value)}>
            {[...groups].map(([category, list]) => (
              <optgroup key={category} label={category || dict.toolbar.noCategory}>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {plural(t.units.pieces, a.quantity, locale)}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelect>
        </Field>
        <Field label={dict.receive.quantity} htmlFor={`${id}-quantity`} error={show(quantity.error)}>
          <Input
            id={`${id}-quantity`}
            value={quantityText}
            onChange={(e) => setQuantityText(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            className="tabular-nums"
            aria-invalid={!!show(quantity.error)}
            aria-required
          />
        </Field>
        <Field label={dict.receive.unitPrice} htmlFor={`${id}-price`} error={show(price.error)}>
          <MoneyInput
            id={`${id}-price`}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            aria-invalid={!!show(price.error)}
            aria-required
          />
        </Field>
        <Field label={t.fields.note} htmlFor={`${id}-note`} className="sm:col-span-2">
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={dict.receive.notePlaceholder}
            rows={2}
          />
        </Field>
      </div>

      {article && (
        <Preview
          title={dict.receive.preview}
          announce={average === null ? "" : `${dict.receive.newPrice}: ${formatMoney(average, locale)}`}
        >
          <PreviewRow
            label={dict.receive.newQuantity}
            value={
              <>
                <span className="text-fg-faint">{article.quantity} → </span>
                {total === null ? "—" : plural(t.units.pieces, total, locale)}
              </>
            }
          />
          <PreviewRow
            label={dict.receive.newPrice}
            value={average === null ? "—" : formatMoney(average, locale)}
            tone={average === null ? "muted" : "default"}
            strong
          />
          {average !== null && average !== article.purchasePrice && (
            <p className="text-right text-[12.5px] text-fg-muted tabular-nums">
              {t.fields.purchasePrice}: <s>{formatMoney(article.purchasePrice, locale)}</s>
            </p>
          )}
        </Preview>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" size="cta" onClick={onClose}>
          {t.actions.cancel}
        </Button>
        <Button type="submit" variant="primary" size="cta" disabled={!article}>
          {dict.receive.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
