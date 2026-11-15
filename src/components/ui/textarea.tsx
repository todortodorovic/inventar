import * as React from "react"
import { useDescribedBy } from "@/components/ui/field-context"
import { cn } from "cn"

/** A plain <textarea>, same look as `<Input>`; inside a `<Field>` it is described by the hint or error. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const describedBy = useDescribedBy(props.id, props["aria-describedby"])
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-surface px-3 py-2 text-base shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-fg-faint hover:border-fg-faint/40 focus-visible:border-fg-soft focus-visible:ring-3 focus-visible:ring-fg/10 disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-[13.5px]",
        className
      )}
      {...props}
      aria-describedby={describedBy}
    />
  )
}

export { Textarea }
