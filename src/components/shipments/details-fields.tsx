"use client"

import type { ReactNode } from "react"
import { useApp } from "@/components/app/app-provider"
import { Field } from "@/components/app/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/content/types"
import { parseAmount } from "@/lib/format"
import type { ShipmentDetails } from "@/lib/inventory/reducer"
import type { Shipment } from "@/lib/inventory/types"

/** The editable part of a shipment as typed: everything is text until saved. */
export type DetailsDraft = {
  name: string
  phone: string
  address: string
  city: string
  postalCode: string
  shippingCost: string
  trackingNumber: string
  note: string
}

export type DetailsErrors = Partial<Record<keyof DetailsDraft, string>>

export const emptyDraft: DetailsDraft = {
  name: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  shippingCost: "0",
  trackingNumber: "",
  note: "",
}

export function draftFrom(shipment: Shipment): DetailsDraft {
  return {
    ...shipment.recipient,
    shippingCost: String(shipment.shippingCost),
    trackingNumber: shipment.trackingNumber,
    note: shipment.note,
  }
}

/** Light checks only: a name, a phone with enough digits to dial, a whole postage amount. */
export function validateDetails(
  draft: DetailsDraft,
  messages: { required: string; wholeNumber: string; phone: string },
): { details: ShipmentDetails | null; errors: DetailsErrors } {
  const errors: DetailsErrors = {}
  if (!draft.name.trim()) errors.name = messages.required
  const digits = draft.phone.replace(/\D/g, "").length
  if (!draft.phone.trim()) errors.phone = messages.required
  else if (digits < 6) errors.phone = messages.phone
  const shippingCost = draft.shippingCost.trim() === "" ? 0 : parseAmount(draft.shippingCost)
  if (shippingCost === null) errors.shippingCost = messages.wholeNumber

  if (Object.keys(errors).length > 0 || shippingCost === null) return { details: null, errors }
  return {
    errors,
    details: {
      recipient: {
        name: draft.name,
        phone: draft.phone,
        address: draft.address,
        city: draft.city,
        postalCode: draft.postalCode,
      },
      shippingCost,
      trackingNumber: draft.trackingNumber,
      note: draft.note,
    },
  }
}

/** A titled group of fields inside a dialog. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3.5">
      <legend className="mb-3.5 font-mono text-[11px] font-medium tracking-[0.16em] text-ink-faint uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

type FieldsProps = {
  /** Prefix for input ids, unique per dialog. */
  idPrefix: string
  draft: DetailsDraft
  errors: DetailsErrors
  onChange: (key: keyof DetailsDraft, value: string) => void
  dict: Dictionary["shipments"]["form"]
}

export function RecipientFields({ idPrefix, draft, errors, onChange, dict }: FieldsProps) {
  const { t } = useApp()
  const id = (key: keyof DetailsDraft) => `${idPrefix}-${key}`
  return (
    <FormSection title={dict.recipient}>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label={`${dict.name} *`} htmlFor={id("name")} error={errors.name}>
          <Input
            id={id("name")}
            value={draft.name}
            onChange={(e) => onChange("name", e.target.value)}
            autoComplete="off"
            aria-invalid={!!errors.name}
            required
          />
        </Field>
        <Field label={`${t.fields.phone} *`} htmlFor={id("phone")} error={errors.phone}>
          <Input
            id={id("phone")}
            type="tel"
            inputMode="tel"
            value={draft.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            autoComplete="off"
            aria-invalid={!!errors.phone}
            required
          />
        </Field>
      </div>
      <Field label={dict.address} htmlFor={id("address")}>
        <Input
          id={id("address")}
          value={draft.address}
          onChange={(e) => onChange("address", e.target.value)}
          autoComplete="off"
        />
      </Field>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3.5">
        <Field label={dict.postalCode} htmlFor={id("postalCode")}>
          <Input
            id={id("postalCode")}
            inputMode="numeric"
            value={draft.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label={dict.city} htmlFor={id("city")}>
          <Input
            id={id("city")}
            value={draft.city}
            onChange={(e) => onChange("city", e.target.value)}
            autoComplete="off"
          />
        </Field>
      </div>
    </FormSection>
  )
}

export function DeliveryFields({ idPrefix, draft, errors, onChange, dict }: FieldsProps) {
  const { t } = useApp()
  const id = (key: keyof DetailsDraft) => `${idPrefix}-${key}`
  return (
    <FormSection title={dict.delivery}>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label={dict.shippingCost} htmlFor={id("shippingCost")} hint={dict.shippingHint} error={errors.shippingCost}>
          <Input
            id={id("shippingCost")}
            inputMode="numeric"
            value={draft.shippingCost}
            onChange={(e) => onChange("shippingCost", e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-invalid={!!errors.shippingCost}
            className="tabular-nums"
          />
        </Field>
        <Field label={dict.tracking} htmlFor={id("trackingNumber")} hint={dict.trackingHint}>
          <Input
            id={id("trackingNumber")}
            value={draft.trackingNumber}
            onChange={(e) => onChange("trackingNumber", e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        </Field>
      </div>
      <Field label={t.fields.note} htmlFor={id("note")}>
        <Textarea
          id={id("note")}
          value={draft.note}
          onChange={(e) => onChange("note", e.target.value)}
          placeholder={dict.notePlaceholder}
          rows={2}
        />
      </Field>
    </FormSection>
  )
}
