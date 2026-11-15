import type { Metadata, Viewport } from "next"
import "../globals.css"
import { inter, jetbrains } from "@/app/fonts"
import { AppProvider } from "@/components/app/app-provider"
import { Toaster } from "@/components/app/toaster"
import { AppHeader } from "@/components/layout/app-header"
import { MobileNav } from "@/components/layout/section-nav"
import { siteConfig } from "@/config/site"
import { getDictionary, getLocale } from "@/content/dictionaries"
import { cn } from "@/lib/utils"

export async function generateStaticParams() {
  return siteConfig.locales.map((lang) => ({ lang }))
}

export async function generateMetadata(): Promise<Metadata> {
  const { common } = await getDictionary()
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: common.meta.title, template: `%s · ${common.meta.title}` },
    description: common.meta.description,
    // A demo with per-tab data: nothing here is worth indexing.
    robots: { index: false, follow: false },
  }
}

export const viewport: Viewport = {
  themeColor: "#f4f5f7",
  viewportFit: "cover",
}

/**
 * The app shell. Pages are static (every locale prerendered); the data is
 * read in the browser, so each section is a client panel inside a static page.
 */
export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale()
  const { common } = await getDictionary(locale)
  const labels = {
    overview: common.nav.overview,
    inventory: common.nav.inventory,
    shipments: common.nav.shipments,
    sales: common.nav.sales,
  }
  return (
    <html lang={siteConfig.localeTags[locale]} className={cn(inter.variable, jetbrains.variable)}>
      <body className="min-h-svh overflow-x-clip bg-canvas">
        {/* First tab stop: jumps past the logo, sections, Demo and SR/EN. A white pill, so it
            reads over the graphite sidebar and the light top bar alike. */}
        <a
          href="#main"
          className="sr-only rounded-md bg-surface text-[13.5px] font-semibold text-fg shadow-pop ring-1 ring-hairline-strong focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-70 focus-visible:px-3.5 focus-visible:py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {common.nav.skipToContent}
        </a>
        <AppProvider locale={locale} t={common}>
          {/* Desktop: a fixed sidebar on the left. Phones: a top bar here and a tab bar at the bottom. */}
          <div className="min-h-svh lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
            <AppHeader dict={common} locale={locale} />
            <main
              id="main"
              tabIndex={-1}
              className="mx-auto w-full max-w-[1240px] min-w-0 px-4 pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] outline-none sm:px-6 lg:px-10 lg:pt-9 lg:pb-16"
            >
              {children}
            </main>
          </div>
          <MobileNav locale={locale} labels={labels} navLabel={common.nav.label} />
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}
