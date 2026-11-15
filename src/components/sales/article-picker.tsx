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
      <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">{dict.article}</legend>

      {articles.length === 0 ? (
        <p className="rounded-2xl bg-sand px-4 py-3.5 text-sm text-ink-muted">{dict.noStock}</p>
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder={dict.findArticle} clearLabel={t.actions.clearSearch} />
          <div
            className="max-h-[236px] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-1 data-[invalid=true]:border-destructive"
            data-invalid={!!error}
          >
            {list.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-ink-muted">{dict.noMatch}</p>
            ) : (
              list.map((a) => {
                const checked = a.id === selectedId
                return (
                  <label
                    key={a.id}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-ink/4 has-checked:bg-ink has-checked:text-cream has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
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
                      className="grid size-5 shrink-0 place-items-center rounded-full border border-line-strong bg-white text-ink"
                      aria-hidden
                    >
                      {checked && <CheckIcon className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">{a.name}</span>
                      <span className="truncate text-xs opacity-65">
                        {[a.category, a.sku].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(a.salePrice, locale)}</span>
                      <span className="text-xs tabular-nums opacity-65">
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
