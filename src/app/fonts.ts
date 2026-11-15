import { Inter, JetBrains_Mono } from "next/font/google"

// Self-hosted at build time by next/font: no request to Google at runtime,
// no layout shift (size-adjusted fallbacks). `latin-ext` covers č ć š ž đ.

/**
 * The app's family for everything people read. Inter's optical-size axis
 * (14–32) tightens the big figures and titles on its own.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  axes: ["opsz"],
  display: "swap",
})

/** Codes only: SKUs, shipment codes, tracking numbers (`font-code`). */
export const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
  display: "swap",
})
