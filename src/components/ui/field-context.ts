"use client"

import { createContext, use } from "react"

/**
 * Set by `<Field>` around its control: the control's id and the ids of the
 * hint / error shown under it. `Input`, `Textarea` and `NativeSelect` read it
 * to point `aria-describedby` at them, however deep they sit in the field.
 */
export const FieldContext = createContext<{ id: string; describedBy?: string } | null>(null)

/** `aria-describedby` for a control: its own value plus the field's hint or error, when the ids match. */
export function useDescribedBy(id: string | undefined, own: string | undefined) {
  const field = use(FieldContext)
  const extra = field && id === field.id ? field.describedBy : undefined
  return [own, extra].filter(Boolean).join(" ") || undefined
}
