"use client"

import { useApp } from "@/components/app/app-provider"
import { StockBadge } from "@/components/app/badges"
import { Panel, PanelHeader } from "@/components/app/panel"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, plural } from "@/lib/format"
import { stockLevel } from "@/lib/inventory/selectors"
import type { Article } from "@/lib/inventory/types"
import { PanelEmpty, SectionLink } from "./figures"

const SHOWN = 6

/** Out-of-stock and nearly-gone articles, emptiest first, with a way into the stock section. */
export function LowStock({ dict, articles }: { dict: Dictionary["overview"]["lowStock"]; articles: Article[] }) {
  const { locale, t } = useApp()
  const rest = articles.length - SHOWN
  return (
    <Panel className="flex h-full min-w-0 flex-col">
      <PanelHeader
        title={dict.title}
        description={dict.description}
        actions={<SectionLink href={localePath(locale, "inventory")}>{dict.link}</SectionLink>}
      />
      {articles.length === 0 ? (
        <PanelEmpty>{dict.empty}</PanelEmpty>
      ) : (
        <div className="px-5 pt-3 pb-5 sm:px-6">
          <ul className="flex flex-col divide-y divide-line">
            {articles.slice(0, SHOWN).map((a) => {
              const level = stockLevel(a)
              return (
                <li key={a.id} className="flex min-h-14 items-center gap-3 py-2.5">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">{a.name}</span>
                    <span className="truncate text-[12px] text-ink-muted tabular-nums">
                      {[a.category, level === "low" && fill(dict.left, { pieces: plural(t.units.pieces, a.quantity, locale) })]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <StockBadge level={level} />
                </li>
              )
            })}
          </ul>
          {rest > 0 && <p className="pt-3 text-[13px] text-ink-muted">{plural(dict.more, rest, locale)}</p>}
        </div>
      )}
    </Panel>
  )
}
