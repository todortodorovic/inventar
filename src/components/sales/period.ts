import { siteConfig, type Locale } from "@/config/site"

export const periods = ["month", "lastMonth", "quarter", "year", "all"] as const
export type Period = (typeof periods)[number]

/** `[from, to)` in local time; `null` ends are open. */
export type Range = { from: Date | null; to: Date | null }

/** The period's range around `now`, in the seller's local time (months start at local midnight). */
export function periodRange(period: Period, now: Date): Range {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (period) {
    case "month":
      return { from: new Date(y, m, 1), to: null }
    case "lastMonth":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) }
    case "quarter":
      // Rolling: from this day three months ago (Date clamps 31 → next month's start, which is fine).
      return { from: new Date(y, m - 3, now.getDate()), to: null }
    case "year":
      return { from: new Date(y, 0, 1), to: null }
    case "all":
      return { from: null, to: null }
  }
}

export function inRange(iso: string, { from, to }: Range) {
  const t = new Date(iso).getTime()
  return (!from || t >= from.getTime()) && (!to || t < to.getTime())
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
