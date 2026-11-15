"use client"

import { PackageIcon, PlusIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { SearchInput } from "@/components/app/search-input"
import { Input } from "@/components/ui/input"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, parseAmount, plural } from "@/lib/format"
import { matches } from "@/lib/inventory/selectors"
import type { Article, Id } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { QuantityStepper } from "./quantity-stepper"

/** One article in the parcel being put together. `price` stays text while typed. */
export type Line = { articleId: Id; quantity: number; price: string }

export const lineFor = (article: Article): Line => ({
  articleId: article.id,
  quantity: 1,
  price: String(article.salePrice),
})

/** Search the shelf, add articles, set how many and at what price. */
export function ItemPicker({
  idPrefix,
  articles,
  lines,
  onChange,
  error,
  priceErrors,
  dict,
}: {
  idPrefix: string
  articles: Article[]
  lines: Line[]
  onChange: (lines: Line[]) => void
  /** Shown under the list, e.g. "add at least one item". */
  error?: string
  /** Per article id. */
  priceErrors: Record<Id, string>
  dict: Dictionary["shipments"]["form"]
}) {
  const { locale, t } = useApp()
  const [query, setQuery] = useState("")

  const inStock = articles
    .filter((a) => a.quantity > 0)
    .sort((a, b) => a.name.localeCompare(b.name, locale))
  const found = inStock.filter((a) => matches(query, a.name, a.sku, a.category))
  const lineOf = (id: Id) => lines.find((l) => l.articleId === id)

  const update = (id: Id, patch: Partial<Line>) =>
    onChange(lines.map((l) => (l.articleId === id ? { ...l, ...patch } : l)))
  // Picking an article already in the parcel adds one more piece, up to what is on the shelf.
  const add = (article: Article) => {
    const line = lineOf(article.id)
    if (!line) onChange([...lines, lineFor(article)])
    else if (line.quantity < article.quantity) update(article.id, { quantity: line.quantity + 1 })
  }
  const remove = (id: Id) => onChange(lines.filter((l) => l.articleId !== id))

  return (
    <div className="flex flex-col gap-3">
      {inStock.length === 0 ? (
        <p className="rounded-2xl bg-sand px-4 py-5 text-center text-sm text-ink-muted">{dict.noArticles}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="border-b border-line bg-sand/60 p-2">
            <SearchInput value={query} onChange={setQuery} placeholder={dict.searchArticles} clearLabel={t.actions.clearSearch} />
          </div>
          <ul className="max-h-[236px] overflow-y-auto overscroll-contain p-1.5">
            {found.length === 0 && <li className="px-3 py-4 text-center text-sm text-ink-muted">{t.filters.noResults}</li>}
            {found.map((a) => {
              const picked = lineOf(a.id)?.quantity ?? 0
              const full = picked >= a.quantity
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => add(a)}
                    disabled={full}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors outline-none hover:bg-sand focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default disabled:opacity-55 disabled:hover:bg-transparent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium break-words">{a.name}</span>
                      <span className="flex flex-wrap gap-x-2 text-xs text-ink-muted">
                        {a.sku && <span className="font-mono">{a.sku}</span>}
                        <span>{fill(dict.onHand, { pieces: plural(t.units.pieces, a.quantity, locale) })}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums">{formatMoney(a.salePrice, locale)}</span>
                    {picked > 0 ? (
                      <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] text-cream tabular-nums">
                        {fill(dict.added, { n: picked })}
                      </span>
                    ) : (
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink/6" aria-hidden>
                        <PlusIcon className="size-4" />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {lines.length === 0 ? (
        <p
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border border-dashed px-4 py-3.5 text-sm",
            error ? "border-destructive/50 text-destructive" : "border-line-strong text-ink-muted",
          )}
          role={error ? "alert" : undefined}
        >
          <PackageIcon className="size-4 shrink-0" aria-hidden />
          {error ?? dict.noLines}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lines.map((line) => {
            const article = articles.find((a) => a.id === line.articleId)
            const name = article?.name ?? line.articleId
            const priceId = `${idPrefix}-price-${line.articleId}`
            const priceError = priceErrors[line.articleId]
            const unit = parseAmount(line.price) ?? 0
            return (
              <li key={line.articleId} className="rounded-2xl bg-sand/70 p-3">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 pt-2 pl-1 text-sm font-semibold break-words">{name}</p>
                  <button
                    type="button"
                    onClick={() => remove(line.articleId)}
                    aria-label={fill(dict.removeLine, { name })}
                    className="grid size-10 shrink-0 place-items-center rounded-full text-ink-muted transition-colors outline-none hover:bg-white hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <XIcon className="size-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <QuantityStepper
                    value={line.quantity}
                    max={Math.max(1, article?.quantity ?? line.quantity)}
                    onChange={(quantity) => update(line.articleId, { quantity })}
                    label={fill(dict.lineQuantity, { name })}
                    decreaseLabel={dict.decrease}
                    increaseLabel={dict.increase}
                  />
                  <span className="text-ink-faint" aria-hidden>
                    ×
                  </span>
                  <Input
                    id={priceId}
                    inputMode="numeric"
                    value={line.price}
                    onChange={(e) => update(line.articleId, { price: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    aria-label={fill(dict.linePrice, { name })}
                    aria-invalid={!!priceError}
                    aria-describedby={priceError ? `${priceId}-error` : undefined}
                    className="w-28 text-right tabular-nums"
                  />
                  <span className="ml-auto text-sm font-semibold tabular-nums">
                    {formatMoney(unit * line.quantity, locale)}
                  </span>
                </div>
                {priceError && (
                  <p id={`${priceId}-error`} role="alert" className="mt-1.5 pl-1 text-[13px] text-destructive">
                    {priceError}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
