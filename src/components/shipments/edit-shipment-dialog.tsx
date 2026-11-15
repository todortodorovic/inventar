"use client"

import { useId, useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Dictionary } from "@/content/types"
import { fill } from "@/lib/format"
import { inventory } from "@/lib/inventory/store"
import type { Shipment } from "@/lib/inventory/types"
import { toast } from "@/lib/toast"
import {
  DeliveryFields,
  draftFrom,
  RecipientFields,
  validateDetails,
  type DetailsDraft,
  type DetailsErrors,
} from "./details-fields"

/**
 * Recipient, postage, tracking and note of an existing parcel. The contents
 * stay as packed: stock and sales already follow them. Mount with a fresh
 * `key` per opening so the form starts from the saved values.
 */
export function EditShipmentDialog({
  open,
  onOpenChange,
  shipment,
  dict,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: Shipment
  dict: Dictionary["shipments"]
}) {
  const { t } = useApp()
  const idPrefix = useId()
  const [draft, setDraft] = useState<DetailsDraft>(() => draftFrom(shipment))
  const [errors, setErrors] = useState<DetailsErrors>({})

  const change = (key: keyof DetailsDraft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const submit = () => {
    const { details, errors: found } = validateDetails(draft, {
      required: t.validation.required,
      wholeNumber: t.validation.wholeNumber,
      phone: dict.validation.phone,
    })
    setErrors(found)
    if (!details) {
      // Focus the first problem in reading order.
      const firstInvalid = (["name", "phone", "shippingCost"] as const).find((key) => found[key])
      if (firstInvalid) document.getElementById(`${idPrefix}-${firstInvalid}`)?.focus()
      return
    }
    const result = inventory.updateShipment(shipment.id, details)
    if (!result.ok) {
      toast(t.errors[result.error], { tone: "error" })
      return
    }
    onOpenChange(false)
    toast(fill(dict.toasts.saved, { code: shipment.code }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fill(dict.form.editTitle, { code: shipment.code })}</DialogTitle>
          <DialogDescription>{dict.form.editDescription}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-w-0 flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <RecipientFields idPrefix={idPrefix} draft={draft} errors={errors} onChange={change} dict={dict.form} />
          <DeliveryFields idPrefix={idPrefix} draft={draft} errors={errors} onChange={change} dict={dict.form} />
          <DialogFooter>
            <Button type="button" variant="ghost" size="cta" onClick={() => onOpenChange(false)}>
              {t.actions.cancel}
            </Button>
            <Button type="submit" variant="primary" size="cta">
              {t.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
