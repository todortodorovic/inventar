"use client"

import type { ReactNode } from "react"
import { FieldContext } from "@/components/ui/field-context"
import { cn } from "@/lib/utils"

/**
 * Label + control + hint/error. Put an `<Input>`, `<NativeSelect>` or
 * `<Textarea>` inside (directly or wrapped, e.g. in a stepper); give the
 * control `id={htmlFor}` and `aria-invalid={!!error}`. The hint or error gets
 * an id (`${htmlFor}-hint` / `${htmlFor}-error`) and the control is described
 * by it automatically. A custom control can use `useDescribedBy` the same way.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode
  htmlFor: string
  hint?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactNode
}) {
  const errorId = `${htmlFor}-error`
  const hintId = `${htmlFor}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg-soft">
        {label}
      </label>
      <FieldContext value={{ id: htmlFor, describedBy }}>{children}</FieldContext>
      {error ? (
        <p id={errorId} role="alert" className="text-[12.5px] text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-[12.5px] text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
