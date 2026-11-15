import { siteConfig, type Locale } from "@/config/site"
import { periodRange as statsPeriodRange, type DateRange } from "@/lib/inventory/stats"

export { inRange } from "@/lib/inventory/stats"

/** Calendar periods plus the rolling "30d" / "3m" ones shared with Pregled. */
export const periods = ["month", "lastMonth", "30d", "3m", "year", "all"] as const
export type Period = (typeof periods)[number]

/**
 * The period's range around `now`, in the seller's local time, as the same
 * `DateRange` the overview uses. The rolling periods come straight from
 * `stats.ts`, so "Poslednjih 30 dana" / "Poslednja 3 meseca" cover the same
 * days (and show the same totals) on Pregled and here.
 */
export function periodRange(period: Period, now: Date): DateRange {
  if (period === "30d" || period === "3m" || period === "all") return statsPeriodRange(period, now).current
  // Every range ends where the overview's do: at the end of today.
  const { end } = statsPeriodRange("all", now).current
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (period) {
    case "month":
      return { start: new Date(y, m, 1).getTime(), end }
    case "lastMonth":
      return { start: new Date(y, m - 1, 1).getTime(), end: new Date(y, m, 1).getTime() }
    case "year":
      return { start: new Date(y, 0, 1).getTime(), end }
  }
}

/**
 * The period's label on phones, where all six must fit at 390px: the calendar
 * periods name their month or year („Nov“, „Okt“, „2026“), the rolling ones
 * use the dictionary's short words.
 */
export function periodShortLabel(period: Period, now: Date, locale: Locale, short: Record<"30d" | "3m" | "all", string>) {
  if (period === "year") return String(now.getFullYear())
  if (period !== "month" && period !== "lastMonth") return short[period]
  const month = new Date(now.getFullYear(), now.getMonth() - (period === "lastMonth" ? 1 : 0), 1)
  const name = formatter("month", locale, { month: "short" }).format(month)
  return name.charAt(0).toLocaleUpperCase(siteConfig.localeTags[locale]) + name.slice(1)
}

/** Local calendar day of an ISO time, `yyyy-mm-dd`: groups sales by the seller's day, not UTC's. */
export function dayKey(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const cache = new Map<string, Intl.DateTimeFormat>()
function formatter(key: string, locale: Locale, options: Intl.DateTimeFormatOptions) {
  let f = cache.get(`${key}:${locale}`)
  if (!f) cache.set(`${key}:${locale}`, (f = new Intl.DateTimeFormat(siteConfig.localeTags[locale], options)))
  return f
}

/** `14:05` */
export const formatTime = (iso: string, locale: Locale) =>
  formatter("time", locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso))

/** `četvrtak, 12. novembar` (the year only when it is not this year's). */
export function formatDay(iso: string, locale: Locale, now: Date) {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === now.getFullYear()
  return formatter(sameYear ? "day" : "day-y", locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(!sameYear && { year: "numeric" }),
  }).format(d)
}

/** `yyyy-mm-dd HH:mm` in local time, for spreadsheets. */
export function formatStamp(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dayKey(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
