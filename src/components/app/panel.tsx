import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

/** The white card every block of content sits on (Catena's 24px card). */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-(--radius-card) border border-line bg-card shadow-[0_1px_2px_rgb(22_22_26/0.04),0_18px_40px_-30px_rgb(22_22_26/0.25)]",
        className,
      )}
      {...props}
    />
  )
}

/** Title row inside a panel, with optional actions on the right. */
export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[19px] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
