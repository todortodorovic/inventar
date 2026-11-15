import { siteConfig, type Locale } from "@/config/site"

/**
 * Formatting in the locale's style. Formatters are cached, since tables call
 * these hundreds of times per render.
 */

const cache = new Map<string, unknown>()
function cached<T>(key: string, make: () => T): T {
  let f = cache.get(key) as T | undefined
  if (!f) cache.set(key, (f = make()))
  return f
}
const tag = (locale: Locale) => siteConfig.localeTags[locale]

/** Replace `{key}` placeholders in a dictionary string. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}

/** `12.490 RSD` (sr), `RSD 12,490` (en). Whole units. */
export function formatMoney(amount: number, locale: Locale) {
  return cached(`money:${locale}`, () =>
    new Intl.NumberFormat(tag(locale), {
      style: "currency",
      currency: siteConfig.currency,
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    }),
  ).format(amount)
}

/** Short money for tight spots and chart axes: `1,2 mil.` / `1.2M`. */
export function formatMoneyCompact(amount: number, locale: Locale) {
  return cached(`compact:${locale}`, () =>
    new Intl.NumberFormat(tag(locale), { notation: "compact", maximumFractionDigits: 1 }),
  ).format(amount)
}

/** `+12.490` / `−3.200`: a signed amount without the currency, for profit deltas. */
export function formatSigned(amount: number, locale: Locale) {
  return cached(`signed:${locale}`, () =>
    new Intl.NumberFormat(tag(locale), { signDisplay: "exceptZero", maximumFractionDigits: 0 }),
  ).format(amount)
}

export function formatNumber(n: number, locale: Locale) {
  return cached(`num:${locale}`, () => new Intl.NumberFormat(tag(locale), { maximumFractionDigits: 0 })).format(n)
}

/** 0.234 → `23%`. */
export function formatPercent(ratio: number, locale: Locale) {
  return cached(`pct:${locale}`, () =>
    new Intl.NumberFormat(tag(locale), { style: "percent", maximumFractionDigits: 0 }),
  ).format(ratio)
}

/** `13. nov 2026.` / `13 Nov 2026` */
export function formatDate(iso: string, locale: Locale) {
  return cached(`date:${locale}`, () =>
    new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", year: "numeric" }),
  ).format(new Date(iso))
}

/** `13. nov 14:05` */
export function formatDateTime(iso: string, locale: Locale) {
  return cached(`dt:${locale}`, () =>
    new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  ).format(new Date(iso))
}

/** `nov 2026` — month labels for charts and filters. */
export function formatMonth(date: Date, locale: Locale, style: "short" | "long" = "short") {
  return cached(`month:${locale}:${style}`, () =>
    new Intl.DateTimeFormat(tag(locale), { month: style, year: "numeric" }),
  ).format(date)
}

/** `pre 3 dana` / `3 days ago`, `danas` / `today`. */
export function formatRelativeDays(iso: string, locale: Locale, now = new Date()) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((start(new Date(iso)) - start(now)) / 86_400_000)
  return cached(`rel:${locale}`, () => new Intl.RelativeTimeFormat(tag(locale), { numeric: "auto" })).format(days, "day")
}

/** Value for `<input type="date">` from an ISO string, in local time. */
export function toDateInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse a money/quantity field typed by a person: "12.490", "12 490", "12490" → 12490. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[\s.,'’]/g, "")
  if (!/^\d+$/.test(cleaned)) return null
  return Number(cleaned)
}

/** Plural forms for a count; Serbian uses `few` (2–4), English ignores it. */
export type Plural = { one: string; few?: string; other: string }

/** Picks the right plural form and fills `{n}`: `3 komada`, `1 piece`. */
export function plural(forms: Plural, n: number, locale: Locale) {
  const rule = cached(`plural:${locale}`, () => new Intl.PluralRules(tag(locale))).select(n)
  const template = (rule === "one" ? forms.one : rule === "few" ? forms.few : undefined) ?? forms.other
  return fill(template, { n: formatNumber(n, locale) })
}
