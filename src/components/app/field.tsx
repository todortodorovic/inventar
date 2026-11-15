import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Label + control + hint/error. Put an `<Input>`, `<NativeSelect>` or
 * `<Textarea>` inside; give the control `id={htmlFor}` and
 * `aria-invalid={!!error}`.
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
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-[13px] text-ink-muted">{hint}</p>
      )}
    </div>
  )
}
