"use client"

import { useSelectedLayoutSegment } from "next/navigation"
import { useApp } from "@/components/app/app-provider"
import { localePath, sections, siteConfig, type Locale, type Section } from "@/config/site"
import { cn } from "@/lib/utils"

const tones = {
  // Phone top bar: a grey track, the current language raised in white.
  // 40px touch targets on phones, the compact 28px pill from md up.
  light: {
    track: "bg-sunken ring-hairline",
    item: "h-10 min-w-10 md:h-7 md:min-w-9 text-fg-muted hover:text-fg focus-visible:outline-ring aria-[current=page]:bg-surface aria-[current=page]:text-fg aria-[current=page]:shadow-xs",
  },
  // Graphite sidebar: the current language on a lighter graphite step.
  dark: {
    track: "bg-graphite-950/60 ring-sidebar-line",
    item: "h-7 min-w-9 text-sidebar-fg-faint hover:text-sidebar-fg focus-visible:outline-accent-on-dark aria-[current=page]:bg-graphite-700 aria-[current=page]:text-sidebar-fg",
  },
}

/**
 * SR / EN segmented control that keeps you on the same section. Plain links
 * on purpose: each language is its own tree, and the dictionaries load on the server.
 * The visible code is short; each link is named in its own language ("Srpski",
 * "English") for screen readers.
 */
export function LanguageSwitch({ locale, label, tone = "light" }: { locale: Locale; label: string; tone?: keyof typeof tones }) {
  const segment = useSelectedLayoutSegment()
  const section: Section = (sections as readonly string[]).includes(segment ?? "") ? (segment as Section) : "overview"
  const { t } = useApp()
  const c = tones[tone]
  return (
    <nav aria-label={label} className={cn("flex shrink-0 gap-0.5 rounded-lg p-[3px] ring-1 ring-inset", c.track)}>
      {siteConfig.locales.map((l) => (
        <a
          key={l}
          href={localePath(l, section)}
          hrefLang={l}
          lang={l}
          aria-label={t.languages[l]}
          aria-current={l === locale ? "page" : undefined}
          className={cn(
            "grid place-items-center rounded-md px-2 text-[12px] font-semibold uppercase transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-0",
            c.item,
          )}
        >
          {l}
        </a>
      ))}
    </nav>
  )
}
