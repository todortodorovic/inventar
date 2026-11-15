import type { ReactNode } from "react"

/**
 * Top of every section: the title, one line of context and
 * the page's actions on the right (they wrap below on phones).
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-6 lg:pb-7">
      <div className="min-w-0 max-w-[640px]">
        <h1 className="type-title text-balance max-sm:text-[22px] max-sm:leading-7">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] leading-normal text-pretty text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
