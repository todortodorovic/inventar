import type { Metadata, Viewport } from "next"
import "../globals.css"
import { bricolage, geist, geistMono } from "@/app/fonts"
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
  themeColor: "#faf8f4",
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
    <html lang={siteConfig.localeTags[locale]} className={cn(geist.variable, bricolage.variable, geistMono.variable)}>
      <body className="min-h-svh overflow-x-clip bg-background">
        <AppProvider locale={locale} t={common}>
          <AppHeader dict={common} locale={locale} />
          <main className="mx-auto w-full max-w-[1320px] px-4 pt-[104px] pb-[calc(112px+env(safe-area-inset-bottom))] sm:px-6 min-[900px]:pt-[128px] min-[900px]:pb-24">
            {children}
          </main>
          <MobileNav locale={locale} labels={labels} navLabel={common.nav.label} />
          <Toaster closeLabel={common.actions.close} />
        </AppProvider>
      </body>
    </html>
  )
}
