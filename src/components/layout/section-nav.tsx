"use client"

import { LayoutDashboardIcon, PackageIcon, ReceiptTextIcon, TruckIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { useApp } from "@/components/app/app-provider"
import { localePath, sections, type Locale, type Section } from "@/config/site"
import { plural } from "@/lib/format"
import { countByStatus } from "@/lib/inventory/selectors"
import { useInventory } from "@/lib/inventory/store"
import { cn } from "@/lib/utils"

const icons: Record<Section, LucideIcon> = {
  overview: LayoutDashboardIcon,
  inventory: PackageIcon,
  shipments: TruckIcon,
  sales: ReceiptTextIcon,
}

/**
 * Which section is open, from the route (not the URL, which rewrites change).
 * The locale root is the overview; any other segment is the 404 (no section).
 */
function useSection(): Section | null {
  const segment = useSelectedLayoutSegment()
  if (segment === null) return "overview"
  return (sections as readonly string[]).includes(segment) ? (segment as Section) : null
}

type Count = { value: number; label: string; strong?: boolean }

/**
 * Live numbers beside the sections: articles on the shelf, parcels still to
 * send (the one that asks for action, so it gets the amber "to send" colour)
 * and sales so far. Null until the browser copy of the data is read.
 */
function useCounts(): Partial<Record<Section, Count>> {
  const { t, locale } = useApp()
  const state = useInventory()
  if (!state) return {}
  const pending = countByStatus(state).pending
  return {
    inventory: { value: state.articles.length, label: plural(t.units.articles, state.articles.length, locale) },
    shipments: pending > 0 ? { value: pending, label: `${t.shipmentStatus.pending}: ${pending}`, strong: true } : undefined,
    sales: { value: state.sales.length, label: plural(t.units.sales, state.sales.length, locale) },
  }
}

type Props = { locale: Locale; labels: Record<Section, string>; navLabel: string }

/**
 * Desktop: the sidebar's list of sections, light on graphite. The open one
 * sits on a raised graphite chip with a lime bar on its left edge and a
 * lime icon.
 */
export function SectionNav({ locale, labels, navLabel }: Props) {
  const active = useSection()
  const counts = useCounts()
  return (
    <nav aria-label={navLabel}>
      <ul className="flex flex-col gap-0.5">
        {sections.map((s) => {
          const Icon = icons[s]
          const count = counts[s]
          return (
            <li key={s}>
              <Link
                href={localePath(locale, s)}
                aria-current={s === active ? "page" : undefined}
                className="group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-sidebar-fg-muted transition-colors outline-none hover:bg-sidebar-raised hover:text-sidebar-fg focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-on-dark aria-[current=page]:bg-sidebar-active aria-[current=page]:text-sidebar-fg aria-[current=page]:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]"
              >
                <span
                  className="absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-on-dark opacity-0 transition-opacity group-aria-[current=page]:opacity-100"
                  aria-hidden
                />
                <Icon
                  className="size-[18px] shrink-0 text-sidebar-fg-faint transition-colors group-hover:text-sidebar-fg-muted group-aria-[current=page]:text-accent-on-dark"
                  strokeWidth={1.9}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{labels[s]}</span>
                {count && (
                  <span
                    className={cn(
                      "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] font-semibold tabular-nums",
                      count.strong ? "bg-status-pending text-graphite-950" : "text-sidebar-fg-faint",
                    )}
                  >
                    <span aria-hidden>{count.value}</span>
                    <span className="sr-only">, {count.label}</span>
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Phones and tablets: a solid white tab bar along the bottom edge. The open tab
 * gets a graphite pill with a lime icon: the strongest contrast on the
 * screen, readable in sunlight.
 */
export function MobileNav({ locale, labels, navLabel }: Props) {
  const active = useSection()
  const counts = useCounts()
  return (
    <nav
      aria-label={navLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgb(17_21_28/0.05)] lg:hidden"
    >
      <div className="mx-auto grid h-(--tabbar-h) max-w-[560px] grid-cols-4 px-1">
        {sections.map((s) => {
          const Icon = icons[s]
          const current = s === active
          const count = counts[s]
          return (
            <Link
              key={s}
              href={localePath(locale, s)}
              aria-current={current ? "page" : undefined}
              className="group flex flex-col items-center justify-center gap-1 rounded-lg text-[11px] leading-none font-medium text-fg-muted transition-colors outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:text-fg"
            >
              <span
                className={cn(
                  "relative grid h-7 w-12 place-items-center rounded-full transition-colors duration-200",
                  current ? "bg-graphite-900" : "group-hover:bg-sunken",
                )}
              >
                <Icon
                  className={cn("size-[18px]", current ? "text-accent-on-dark" : "text-fg-muted")}
                  strokeWidth={current ? 2.1 : 1.9}
                  aria-hidden
                />
                {count?.strong && (
                  <span className="absolute -top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-status-pending px-1 text-[10px] leading-none font-bold text-graphite-950 tabular-nums ring-2 ring-surface">
                    <span aria-hidden>{count.value}</span>
                    <span className="sr-only">, {count.label}</span>
                  </span>
                )}
              </span>
              {labels[s]}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
