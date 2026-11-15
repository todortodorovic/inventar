"use client"

import { useId, useState, type FormEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { Field } from "@/components/app/field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatPercent, formatSigned, plural } from "@/lib/format"
import { marginOf } from "@/lib/inventory/selectors"
import { inventory } from "@/lib/inventory/store"
import type { Article, Id } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { MoneyInput, Preview, PreviewRow, readAmount, toneOf, Warning } from "./form-bits"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The article to edit; without it the dialog creates a new one. */
  article?: Article
  categories: string[]
  dict: Dictionary["inventory"]
  onSaved: (id: Id) => void
}

/** Create or edit an article, with a live profit preview. */
export function ArticleFormDialog({ open, onOpenChange, article, categories, dict, onSaved }: Props) {
  const { t } = useApp()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-xl">
        {/* Inside the popup, so the form starts fresh each time the dialog opens. */}
        <ArticleForm article={article} categories={categories} dict={dict} onSaved={onSaved} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function ArticleForm({
  article,
  categories,
  dict,
  onSaved,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { t, locale } = useApp()
  const id = useId()
  const [name, setName] = useState(article?.name ?? "")
  const [category, setCategory] = useState(article?.category ?? "")
  const [sku, setSku] = useState(article?.sku ?? "")
  const [purchaseText, setPurchaseText] = useState(article ? String(article.purchasePrice) : "")
  const [saleText, setSaleText] = useState(article ? String(article.salePrice) : "")
  const [quantityText, setQuantityText] = useState("")
  const [note, setNote] = useState(article?.note ?? "")
  const [submitted, setSubmitted] = useState(false)

  const nameError = name.trim() ? undefined : t.validation.required
  const purchase = readAmount(purchaseText, t.validation)
  const sale = readAmount(saleText, t.validation)
  const quantity = article
    ? { value: article.quantity, error: undefined }
    : readAmount(quantityText, t.validation, { required: false })

  const pricesOk = purchase.value !== null && sale.value !== null
  const unit = pricesOk ? sale.value! - purchase.value! : null
  const margin = pricesOk ? marginOf(sale.value!, purchase.value!) : null
  const pieces = quantity.value ?? 0

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const firstInvalid = [
      ["name", nameError],
      ["purchase", purchase.error],
      ["sale", sale.error],
      ["quantity", quantity.error],
    ].find(([, error]) => error)
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid[0]}`)?.focus()
      return
    }
    const input = { name, category, sku, note, purchasePrice: purchase.value!, salePrice: sale.value! }

    if (article) {
      const result = inventory.updateArticle(article.id, input)
      if (!result.ok) {
        toast(t.errors[result.error], { tone: "error" })
        return
      }
      toast(dict.form.updated)
      onSaved(article.id)
    } else {
      const result = inventory.createArticle(input, pieces)
      if (!result.ok) {
        toast(t.errors[result.error], { tone: "error" })
        return
      }
      toast(dict.form.created, {
        action: {
          label: t.actions.undo,
          onClick: () => {
            const undo = inventory.undoCreateArticle(result.id)
            if (!undo.ok) toast(t.errors[undo.error], { tone: "error" })
          },
        },
      })
      onSaved(result.id)
    }
    onClose()
  }

  const show = (error?: string) => (submitted ? error : undefined)

  return (
    <form noValidate onSubmit={submit} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{article ? dict.form.editTitle : dict.form.createTitle}</DialogTitle>
        <DialogDescription>{article ? dict.form.editDescription : dict.form.createDescription}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.fields.name} htmlFor={`${id}-name`} error={show(nameError)} className="sm:col-span-2">
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={dict.form.namePlaceholder}
            aria-invalid={!!show(nameError)}
            aria-required
            autoComplete="off"
          />
        </Field>
        <Field label={t.fields.category} htmlFor={`${id}-category`}>
          <Input
            id={`${id}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={dict.form.categoryPlaceholder}
            list={`${id}-categories`}
            autoComplete="off"
          />
          <datalist id={`${id}-categories`}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label={t.fields.sku} htmlFor={`${id}-sku`}>
          <Input
            id={`${id}-sku`}
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            placeholder={dict.form.skuPlaceholder}
            className="font-code"
            autoComplete="off"
            autoCapitalize="characters"
          />
        </Field>
        <Field label={t.fields.purchasePrice} htmlFor={`${id}-purchase`} error={show(purchase.error)}>
          <MoneyInput
            id={`${id}-purchase`}
            value={purchaseText}
            onChange={(e) => setPurchaseText(e.target.value)}
            aria-invalid={!!show(purchase.error)}
            aria-required
          />
        </Field>
        <Field label={t.fields.salePrice} htmlFor={`${id}-sale`} error={show(sale.error)}>
          <MoneyInput
            id={`${id}-sale`}
            value={saleText}
            onChange={(e) => setSaleText(e.target.value)}
            aria-invalid={!!show(sale.error)}
            aria-required
          />
        </Field>
        {!article && (
          <Field
            label={dict.form.openingQuantity}
            htmlFor={`${id}-quantity`}
            hint={dict.form.openingHint}
            error={show(quantity.error)}
            className="sm:col-span-2"
          >
            <Input
              id={`${id}-quantity`}
              value={quantityText}
              onChange={(e) => setQuantityText(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              className="tabular-nums sm:max-w-[200px]"
              aria-invalid={!!show(quantity.error)}
            />
          </Field>
        )}
        <Field label={t.fields.note} htmlFor={`${id}-note`} className="sm:col-span-2">
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={dict.form.notePlaceholder}
            rows={2}
          />
        </Field>
      </div>

      <Preview
        title={dict.form.preview}
        announce={
          unit === null
            ? ""
            : `${fill(dict.form.expectedFor, { pieces: plural(t.units.pieces, pieces, locale) })}: ${formatMoney(unit * pieces, locale)}`
        }
      >
        <PreviewRow
          label={dict.form.unitProfit}
          value={unit === null ? "—" : formatSigned(unit, locale)}
          tone={unit === null ? "muted" : toneOf(unit)}
        />
        <PreviewRow
          label={t.fields.margin}
          value={margin === null ? "—" : formatPercent(margin, locale)}
          tone={margin === null ? "muted" : "default"}
        />
        <PreviewRow
          label={fill(dict.form.expectedFor, { pieces: plural(t.units.pieces, pieces, locale) })}
          value={unit === null ? "—" : formatMoney(unit * pieces, locale)}
          tone={unit === null ? "muted" : toneOf(unit * pieces)}
          strong
        />
      </Preview>
      {unit !== null && unit < 0 && <Warning>{dict.form.belowCost}</Warning>}

      <DialogFooter>
        <Button type="button" variant="ghost" size="cta" onClick={onClose}>
          {t.actions.cancel}
        </Button>
        <Button type="submit" variant="primary" size="cta">
          {article ? t.actions.save : dict.form.submitCreate}
        </Button>
      </DialogFooter>
    </form>
  )
}
