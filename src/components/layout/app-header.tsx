import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { DemoMenu } from "@/components/layout/demo-menu"
import { HeaderFrame } from "@/components/layout/header-frame"
import { LanguageSwitch } from "@/components/layout/language-switch"
import { SectionNav } from "@/components/layout/section-nav"
import { localePath, type Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"

/**
 * The app chrome. Desktop: a graphite sidebar with the logo, the sections
 * (with live counts) and the demo/language controls at the bottom.
 * Phones: a light frosted top bar (the sections move to the bottom tab bar).
 */
export function AppHeader({ dict, locale }: { dict: Dictionary["common"]; locale: Locale }) {
  const labels = {
    overview: dict.nav.overview,
    inventory: dict.nav.inventory,
    shipments: dict.nav.shipments,
    sales: dict.nav.sales,
  }
  return (
    <>
      <HeaderFrame>
        <Link
          href={localePath(locale)}
          className="-ml-1 rounded-md p-1 outline-none focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <DemoMenu />
          <LanguageSwitch locale={locale} label={dict.nav.languageLabel} />
        </div>
      </HeaderFrame>

      {/* The graphite column runs the full page height; its content stays put while the page scrolls. */}
      <div className="hidden bg-sidebar text-sidebar-fg lg:block">
        <div className="sticky top-0 flex h-svh flex-col">
          <div className="flex h-[68px] shrink-0 items-center px-5">
            <Link
              href={localePath(locale)}
              className="-ml-1 rounded-md p-1 outline-none focus-visible:outline-2 focus-visible:outline-accent-on-dark"
            >
              <Logo tone="dark" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pt-2">
            <SectionNav locale={locale} labels={labels} navLabel={dict.nav.label} />
          </div>
          <div className="m-3 flex items-center gap-2 rounded-[10px] bg-sidebar-raised p-1.5 ring-1 ring-sidebar-line">
            <DemoMenu layout="row" />
            <LanguageSwitch locale={locale} label={dict.nav.languageLabel} tone="dark" />
          </div>
        </div>
      </div>
    </>
  )
}
