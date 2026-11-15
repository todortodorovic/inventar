"use client"

import { useId, useState, type FormEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { Field } from "@/components/app/field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatSigned, plural } from "@/lib/format"
import { inventory } from "@/lib/inventory/store"
import type { Article, Id } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import { Preview, PreviewRow, readAmount, toneOf } from "./form-bits"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | undefined
  dict: Dictionary["inventory"]
  /** The article's quantity right now (undo runs later, after other changes). */
  quantityOf: (id: Id) => number | undefined
  onSaved: (id: Id) => void
}

/** Stocktake: set the counted quantity; the difference is logged as a correction. */
export function AdjustDialog({ open, onOpenChange, article, dict, quantityOf, onSaved }: Props) {
  const { t } = useApp()
  return (
    <Dialog open={open && !!article} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-md">
        {article && (
          <AdjustForm
            article={article}
            dict={dict}
            quantityOf={quantityOf}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AdjustForm({
  article,
  dict,
  quantityOf,
  onSaved,
  onClose,
}: Omit<Props, "open" | "onOpenChange" | "article"> & { article: Article; onClose: () => void }) {
  const { t, locale } = useApp()
  const id = useId()
  const [countedText, setCountedText] = useState(String(article.quantity))
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const counted = readAmount(countedText, t.validation)
  const diff = counted.value === null ? null : counted.value - article.quantity

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (counted.error) {
      document.getElementById(`${id}-counted`)?.focus()
      return
    }
    if (diff === null || diff === 0) return onClose()
    const result = inventory.adjustQuantity(article.id, counted.value!, note)
    if (!result.ok) {
      toast(t.errors[result.error], { tone: "error" })
      return
    }
    toast(fill(dict.adjust.done, { name: article.name }), {
      action: {
        label: t.actions.undo,
        // Take back only this correction's difference: sales or receipts made since then stay counted.
        onClick: () => {
          const now = quantityOf(article.id)
          if (now === undefined) return toast(t.errors["not-found"], { tone: "error" })
          if (now - diff < 0) return toast(t.errors["insufficient-stock"], { tone: "error" })
          const undo = inventory.adjustQuantity(article.id, now - diff)
          if (!undo.ok) toast(t.errors[undo.error], { tone: "error" })
        },
      },
    })
    onSaved(article.id)
    onClose()
  }

  const error = submitted ? counted.error : undefined

  return (
    <form noValidate onSubmit={submit} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>
          {dict.adjust.title}: {article.name}
        </DialogTitle>
        <DialogDescription>{dict.adjust.description}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium text-fg-soft">{dict.adjust.current}</p>
          <p className="flex h-10 items-center text-[22px] font-semibold tracking-[-0.02em] tabular-nums md:h-9">
            {article.quantity}
          </p>
        </div>
        <Field label={dict.adjust.counted} htmlFor={`${id}-counted`} error={error}>
          <Input
            id={`${id}-counted`}
            value={countedText}
            onChange={(e) => setCountedText(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            className="font-semibold tabular-nums"
            aria-invalid={!!error}
            aria-required
            onFocus={(e) => e.currentTarget.select()}
          />
        </Field>
        <Field label={t.fields.note} htmlFor={`${id}-note`} className="col-span-2">
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={dict.adjust.notePlaceholder}
            rows={2}
          />
        </Field>
      </div>

      <Preview
        title={dict.adjust.difference}
        announce={
          diff === null ? "" : diff === 0 ? dict.adjust.noChange : `${dict.adjust.difference}: ${formatSigned(diff, locale)}`
        }
      >
        <PreviewRow
          label={diff === null || diff === 0 ? dict.adjust.noChange : plural(t.units.pieces, Math.abs(diff), locale)}
          value={diff === null ? "—" : formatSigned(diff, locale)}
          tone={diff === null || diff === 0 ? "muted" : toneOf(diff)}
          strong
        />
        {diff !== null && diff !== 0 && (
          <PreviewRow
            label={t.fields.cost}
            value={formatMoney(diff * article.purchasePrice, locale)}
            tone={toneOf(diff)}
          />
        )}
      </Preview>

      <DialogFooter>
        <Button type="button" variant="ghost" size="cta" onClick={onClose}>
          {t.actions.cancel}
        </Button>
        <Button type="submit" variant="primary" size="cta">
          {dict.adjust.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
