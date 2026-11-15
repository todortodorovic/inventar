import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

/** The white card every block of content sits on: 12px corners, a hairline, a breath of shadow. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-(--radius-card) border border-hairline bg-card shadow-card", className)} {...props} />
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
    <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:flex-nowrap sm:px-5 sm:pt-5", className)}>
      <div className="min-w-0">
        <h2 className="type-heading">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
