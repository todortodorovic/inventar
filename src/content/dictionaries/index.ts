import { notFound } from "next/navigation"
import { lang } from "next/root-params"
import { isLocale, type Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"

// Each dictionary is its own chunk and only ever loads on the server. Pages
// pass client components just the slice they need.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  sr: () => import("./sr").then((m) => m.sr),
  en: () => import("./en").then((m) => m.en),
}

/** The current request's locale, read from the `[lang]` root segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang()
  if (!isLocale(locale)) notFound()
  return locale
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  return dictionaries[locale ?? (await getLocale())]()
}
