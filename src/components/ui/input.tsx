import * as React from "react"
import { useDescribedBy } from "@/components/ui/field-context"
import { cn } from "@/lib/utils"

// A plain <input> (as in shadcn's Radix styles), no JavaScript primitive.
// Inside a `<Field>` it is described by the field's hint or error.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const describedBy = useDescribedBy(props.id, props["aria-describedby"])
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-surface shadow-xs transition-[border-color,box-shadow] outline-none hover:border-fg-faint/40 focus-visible:border-fg-soft focus-visible:ring-3 focus-visible:ring-fg/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:h-9 md:text-[13.5px] px-3 py-1 text-base file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-fg-faint",
        className,
      )}
      {...props}
      aria-describedby={describedBy}
    />
  )
}

export { Input }
