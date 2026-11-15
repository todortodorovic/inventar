import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { DemoMenu } from "@/components/layout/demo-menu"
import { HeaderFrame } from "@/components/layout/header-frame"
import { LanguageSwitch } from "@/components/layout/language-switch"
import { SectionNav } from "@/components/layout/section-nav"
import { localePath, type Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { cn } from "@/lib/utils"

/** Catena's header: transparent at the top, a frosted pill once the page scrolls. */
export function AppHeader({ dict, locale }: { dict: Dictionary["common"]; locale: Locale }) {
  const labels = {
    overview: dict.nav.overview,
    inventory: dict.nav.inventory,
    shipments: dict.nav.shipments,
    sales: dict.nav.sales,
  }
  return (
    <HeaderFrame>
      <div
        className={cn(
          "grid w-full max-w-[1320px] grid-cols-[1fr_auto] items-center gap-4 rounded-full border border-transparent py-2 transition-all duration-400 ease-soft min-[900px]:grid-cols-[1fr_auto_1fr]",
          "group-data-scrolled/header:max-w-[1180px] group-data-scrolled/header:border-line group-data-scrolled/header:bg-cream/88 group-data-scrolled/header:pr-2 group-data-scrolled/header:pl-[18px]",
          "group-data-scrolled/header:shadow-[0_10px_30px_-14px_rgb(22_22_26/0.3)] group-data-scrolled/header:backdrop-blur-[14px] group-data-scrolled/header:backdrop-saturate-140",
        )}
      >
        <Link href={localePath(locale)} className="justify-self-start text-ink">
          <Logo />
        </Link>

        <div className="hidden min-[900px]:block">
          <SectionNav locale={locale} labels={labels} navLabel={dict.nav.label} />
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <DemoMenu />
          <LanguageSwitch locale={locale} label={dict.nav.languageLabel} />
        </div>
      </div>
    </HeaderFrame>
  )
}
