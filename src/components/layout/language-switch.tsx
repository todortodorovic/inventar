"use client"

import { useSelectedLayoutSegment } from "next/navigation"
import { localePath, sections, siteConfig, type Locale, type Section } from "@/config/site"

/**
 * SR / EN toggle that keeps you on the same section. Plain links on purpose:
 * each language is its own tree, and the dictionaries load on the server.
 */
export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const segment = useSelectedLayoutSegment()
  const section: Section = (sections as readonly string[]).includes(segment ?? "") ? (segment as Section) : "overview"
  return (
    <nav aria-label={label} className="flex gap-0.5 rounded-full bg-ink/6 p-[3px]">
      {siteConfig.locales.map((l) => (
        <a
          key={l}
          href={localePath(l, section)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "page" : undefined}
          className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-muted uppercase transition-colors hover:text-ink aria-[current=page]:bg-white aria-[current=page]:text-ink aria-[current=page]:shadow-[0_1px_3px_rgb(22_22_26/0.12)]"
        >
          {l}
        </a>
      ))}
    </nav>
  )
}
