"use client"

import { createContext, use, type ReactNode } from "react"
import type { Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"

type AppContext = { locale: Locale; t: Dictionary["common"] }

const Context = createContext<AppContext | null>(null)

/**
 * Gives every client component the locale and the shared copy
 * (`dict.common`: statuses, units, errors, field names) without prop drilling.
 * Section-specific copy is still passed down as props from the page.
 */
export function AppProvider({ locale, t, children }: AppContext & { children: ReactNode }) {
  return <Context value={{ locale, t }}>{children}</Context>
}

export function useApp(): AppContext {
  const ctx = use(Context)
  if (!ctx) throw new Error("useApp() must be used inside <AppProvider>")
  return ctx
}
