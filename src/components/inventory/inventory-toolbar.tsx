"use client"

import { FilterXIcon } from "lucide-react"
import { useId } from "react"
import { useApp } from "@/components/app/app-provider"
import { ChipGroup } from "@/components/app/chip-group"
import { SearchInput } from "@/components/app/search-input"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import type { Dictionary } from "@/content/types"
import { fill, plural } from "@/lib/format"
import type { StockLevel } from "@/lib/inventory/selectors"
import { ALL, isFiltered, NO_CATEGORY, sortKeys, type Filters, type SortKey } from "./filters"

const levels = [ALL, "ok", "low", "out"] as const

/**
 * Search, category, stock level and sort. Stock level is a segmented control
 * everywhere; categories are chips on desktop and a full-width native select
 * on phones (the system picker never overflows).
 */
export function InventoryToolbar({
  filters,
  onChange,
  categories,
  counts,
  shown,
  dict,
}: {
  filters: Filters
  onChange: (next: Filters) => void
  /** Categories in use, sorted; `hasUncategorized` adds a "no category" choice. */
  categories: { names: string[]; hasUncategorized: boolean }
  counts: { categories: Map<string, number>; levels: Record<StockLevel | typeof ALL, number> }
  shown: number
  dict: Dictionary["inventory"]
}) {
  const { t, locale } = useApp()
  const id = useId()
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })

  const categoryOptions = [
    { value: ALL, label: t.filters.allCategories },
    ...categories.names.map((c) => ({ value: c, label: c })),
    ...(categories.hasUncategorized ? [{ value: NO_CATEGORY, label: dict.toolbar.noCategory }] : []),
  ].map((o) => ({ ...o, count: counts.categories.get(o.value) ?? 0 }))

  const levelOptions = levels.map((l) => ({
    value: l,
    label: l === ALL ? t.filters.all : t.stock[l],
    count: counts.levels[l],
  }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={filters.query}
          onChange={(q) => set("query", q)}
          placeholder={dict.toolbar.search}
          clearLabel={t.actions.clearSearch}
          className="lg:w-[340px] lg:shrink-0"
        />
        {/* Phones: the category as a full-width select, so "Sve kategorije (18)" never truncates. */}
        <NativeSelect
          aria-label={dict.toolbar.category}
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
          className="lg:hidden"
        >
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.count})
            </option>
          ))}
        </NativeSelect>
        {/* Stock level: four short options, so a segmented control everywhere (it scrolls if it must). */}
        <ChipGroup
          label={dict.toolbar.level}
          value={filters.level}
          onChange={(v) => set("level", v)}
          options={levelOptions}
          className="self-stretch lg:self-start"
        />
      </div>

      <ChipGroup
        label={dict.toolbar.category}
        value={filters.category}
        onChange={(v) => set("category", v)}
        options={categoryOptions}
        className="hidden self-start lg:flex"
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-h-10 items-center gap-2">
          <p className="text-[13px] text-fg-muted tabular-nums" aria-live="polite">
            {fill(dict.toolbar.shown, { articles: plural(t.units.articles, shown, locale) })}
          </p>
          {isFiltered(filters) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-[13px] text-fg-soft hover:bg-sunken hover:text-fg"
              onClick={() => onChange({ ...filters, query: "", category: ALL, level: ALL })}
            >
              <FilterXIcon aria-hidden />
              {dict.toolbar.clearFilters}
            </Button>
          )}
        </div>
        {/* Phones: sort shares the line with "Prikazano" (its label is read, not shown), so the first card moves up. */}
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <label htmlFor={`${id}-sort`} className="shrink-0 text-[13px] text-fg-muted max-sm:sr-only">
            {dict.toolbar.sort}
          </label>
          <NativeSelect
            id={`${id}-sort`}
            value={filters.sort}
            onChange={(e) => set("sort", e.target.value as SortKey)}
            className="w-[210px] max-sm:w-[176px]"
          >
            {sortKeys.map((k) => (
              <option key={k} value={k}>
                {dict.toolbar.sortBy[k]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
    </div>
  )
}
