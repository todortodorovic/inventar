import { ChevronDownIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { useDescribedBy } from "@/components/ui/field-context"
import { cn } from "@/lib/utils"

/** A styled native <select>: accessible, works on phones, no JavaScript. Same look as <Input>. */
function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  const describedBy = useDescribedBy(props.id, props["aria-describedby"])
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        data-slot="native-select"
        className="h-10 w-full appearance-none min-w-0 rounded-md border border-input bg-surface shadow-xs transition-[border-color,box-shadow] outline-none hover:border-fg-faint/40 focus-visible:border-fg-soft focus-visible:ring-3 focus-visible:ring-fg/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:h-9 md:text-[13.5px] pr-9 pl-3 text-base"
        {...props}
        aria-describedby={describedBy}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-fg-faint"
        aria-hidden
      />
    </div>
  )
}

export { NativeSelect }
