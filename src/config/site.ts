/**
 * App-wide settings. Everything a non-developer is likely to change lives
 * here or in `src/content/dictionaries/*` (all copy). Colours, type and radii
 * live in `src/app/globals.css` under "Design tokens".
 */
export const siteConfig = {
  name: "Inventar",
  /** Absolute origin used for canonical URLs. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /** First entry is served without a prefix (`/`, `/inventory`…), the others at `/<locale>/…`. */
  locales: ["sr", "en"] as const,
  defaultLocale: "sr",
  /** BCP 47 tags used for number/currency/date formatting and `<html lang>`. */
  localeTags: { sr: "sr-Latn-RS", en: "en-GB" },

  /** ISO 4217 code every price is kept in. Amounts are whole units (no cents). */
  currency: "RSD",

  inventory: {
    /** At or below this many pieces an article counts as "running low". */
    lowStockAt: 2,
    /**
     * Data lives only in this browser tab's sessionStorage under this key.
     * Bump the version suffix when the stored shape changes.
     */
    storageKey: "inventar:v1",
  },
} as const

export type Locale = (typeof siteConfig.locales)[number]

export const isLocale = (value: string): value is Locale =>
  (siteConfig.locales as readonly string[]).includes(value)

/** The app's sections, in navigation order. `path` is relative to the locale root. */
export const sections = ["overview", "inventory", "shipments", "sales"] as const
export type Section = (typeof sections)[number]
export const sectionPath: Record<Section, string> = {
  overview: "",
  inventory: "/inventory",
  shipments: "/shipments",
  sales: "/sales",
}

/** Public URL of a section in a locale: the default locale has no prefix. */
export function localePath(locale: Locale, section: Section = "overview") {
  const prefix = locale === siteConfig.defaultLocale ? "" : `/${locale}`
  return `${prefix}${sectionPath[section]}` || "/"
}
