import type { ReactNode } from "react"

/**
 * Top of every section: a mono eyebrow, a big Bricolage title, one line of
 * context and the page's actions on the right (they wrap below on phones).
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pb-8">
      <div className="min-w-0 max-w-[680px]">
        {eyebrow && (
          <p className="mb-3 font-mono text-[11px] font-medium tracking-[0.16em] text-ink-faint uppercase">{eyebrow}</p>
        )}
        <h1 className="font-display text-[clamp(38px,5vw,64px)] leading-[0.95] font-bold tracking-[-0.05em] text-balance">
          {title}
        </h1>
        {subtitle && <p className="mt-3.5 text-[17px] leading-normal text-pretty text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  )
}
