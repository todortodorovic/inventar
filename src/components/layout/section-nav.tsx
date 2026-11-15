"use client"

import { LayoutDashboardIcon, PackageIcon, ReceiptTextIcon, TruckIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { localePath, sections, type Locale, type Section } from "@/config/site"
import { cn } from "@/lib/utils"

const icons: Record<Section, LucideIcon> = {
  overview: LayoutDashboardIcon,
  inventory: PackageIcon,
  shipments: TruckIcon,
  sales: ReceiptTextIcon,
}

/** Which section is open, from the route (not the URL, which rewrites change). */
function useSection(): Section {
  const segment = useSelectedLayoutSegment()
  return (sections as readonly string[]).includes(segment ?? "") ? (segment as Section) : "overview"
}

type Props = { locale: Locale; labels: Record<Section, string>; navLabel: string }

/** Desktop: links in the header pill. The active one is a raised white chip. */
export function SectionNav({ locale, labels, navLabel }: Props) {
  const active = useSection()
  return (
    <nav aria-label={navLabel} className="hidden items-center gap-0.5 rounded-full bg-ink/6 p-[3px] min-[900px]:flex">
      {sections.map((s) => {
        const Icon = icons[s]
        return (
          <Link
            key={s}
            href={localePath(locale, s)}
            aria-current={s === active ? "page" : undefined}
            className="flex items-center gap-2 rounded-full px-3.5 py-[7px] text-[15px] font-medium text-ink-soft transition-colors hover:text-ink aria-[current=page]:bg-white aria-[current=page]:text-ink aria-[current=page]:shadow-[0_1px_3px_rgb(22_22_26/0.12)]"
          >
            <Icon className="size-4" aria-hidden />
            {labels[s]}
          </Link>
        )
      })}
    </nav>
  )
}

/** Phones and tablets: a tab bar along the bottom edge. */
export function MobileNav({ locale, labels, navLabel }: Props) {
  const active = useSection()
  return (
    <nav
      aria-label={navLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-[14px] backdrop-saturate-140 min-[900px]:hidden"
    >
      <div className="mx-auto grid max-w-[560px] grid-cols-4">
        {sections.map((s) => {
          const Icon = icons[s]
          const current = s === active
          return (
            <Link
              key={s}
              href={localePath(locale, s)}
              aria-current={current ? "page" : undefined}
              className="group flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold text-ink-muted transition-colors aria-[current=page]:text-ink"
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-full transition-colors",
                  current && "bg-ink text-cream shadow-[0_2px_0_0_var(--pop)]",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </span>
              {labels[s]}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
