"use client"

import { CheckIcon } from "lucide-react"
import { useId, useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { SearchInput } from "@/components/app/search-input"
import { siteConfig } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, plural } from "@/lib/format"
import { matches } from "@/lib/inventory/selectors"
import type { Article, Id } from "@/lib/inventory/types"

/**
 * Searchable list of articles in stock, as native radios: arrow keys move
 * the choice, and it reads as one group to screen readers.
 */
export function ArticlePicker({
  articles,
  selectedId,
  onSelect,
  error,
  dict,
}: {
  /** Articles with pieces on the shelf. */
  articles: Article[]
  selectedId: Id | null
  onSelect: (article: Article) => void
  error: string | null
  dict: Dictionary["sales"]["dialog"]
}) {
  const { t, locale } = useApp()
  const id = useId()
  const [query, setQuery] = useState("")

  // The chosen article stays listed even when the search no longer matches it.
  const list = articles
    .filter((a) => a.id === selectedId || matches(query, a.name, a.category, a.sku))
    .sort((a, b) => a.name.localeCompare(b.name, siteConfig.localeTags[locale]))

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-1.5 text-[13px] font-medium text-fg-soft">{dict.article}</legend>

      {articles.length === 0 ? (
        <p className="rounded-lg border border-hairline bg-sunken px-4 py-3.5 text-[13px] text-fg-muted">{dict.noStock}</p>
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder={dict.findArticle} clearLabel={t.actions.clearSearch} />
          <div
            className="max-h-[236px] overflow-y-auto overscroll-contain rounded-lg border border-hairline-strong bg-surface p-1 shadow-xs data-[invalid=true]:border-destructive"
            data-invalid={!!error}
          >
            {list.length === 0 ? (
              <p className="px-3 py-4 text-center text-[13px] text-fg-muted">{dict.noMatch}</p>
            ) : (
              list.map((a) => {
                const checked = a.id === selectedId
                return (
                  <label
                    key={a.id}
                    className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-sunken has-checked:bg-accent-soft has-checked:text-fg has-checked:ring-1 has-checked:ring-accent-edge/40 has-checked:ring-inset has-focus-visible:ring-2 has-focus-visible:ring-ring"
                  >
                    <input
                      type="radio"
                      name={`${id}-article`}
                      value={a.id}
                      checked={checked}
                      onChange={() => onSelect(a)}
                      className="sr-only"
                    />
                    <span
                      className="grid size-[18px] shrink-0 place-items-center rounded-full border border-hairline-strong bg-surface text-accent-fg shadow-xs group-has-checked:border-accent-edge group-has-checked:bg-accent"
                      aria-hidden
                    >
                      {checked && <CheckIcon className="size-3" strokeWidth={3.2} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13.5px] font-medium">{a.name}</span>
                      <span className="truncate text-[12px] text-fg-muted">
                        {a.category}
                        {a.category && a.sku && " · "}
                        {a.sku && <span className="font-code text-[11px]">{a.sku}</span>}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="text-[13.5px] font-semibold tabular-nums">{formatMoney(a.salePrice, locale)}</span>
                      <span className="text-[12px] text-fg-muted tabular-nums">
                        {fill(dict.onHand, { pieces: plural(t.units.pieces, a.quantity, locale) })}
                      </span>
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
