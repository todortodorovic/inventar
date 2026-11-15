import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** What a list shows when it has nothing (or nothing matches the filters). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="mb-4 grid size-10 place-items-center rounded-lg bg-surface text-fg-muted shadow-xs ring-1 ring-hairline-strong">
        <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
      </span>
      <p className="type-heading">{title}</p>
      {description && <p className="mt-1 max-w-[360px] text-[13.5px] leading-relaxed text-pretty text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
