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
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-sand text-ink-muted">
        <Icon className="size-[22px]" aria-hidden />
      </span>
      <p className="font-display text-lg font-semibold tracking-[-0.02em]">{title}</p>
      {description && <p className="mt-1.5 max-w-[360px] text-sm text-pretty text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
