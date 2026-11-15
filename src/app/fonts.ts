import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"

// Self-hosted at build time by next/font: no request to Google at runtime,
// no layout shift (size-adjusted fallbacks). `latin-ext` covers č ć š ž đ.

/** Body copy, tables, forms. */
export const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
  display: "swap",
})

/** Headings, big numbers and buttons. Variable font with an optical-size axis. */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  axes: ["opsz"],
  display: "swap",
})

/** Small uppercase labels, codes (SKU, shipment numbers). */
export const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-mono",
  display: "swap",
})
