import { ChevronDownIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/** A styled native <select>: accessible, works on phones, no JavaScript. Same look as <Input>. */
function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        data-slot="native-select"
        className="h-10 w-full min-w-0 appearance-none rounded-lg border border-input bg-white pr-9 pl-3 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
    </div>
  )
}

export { NativeSelect }
