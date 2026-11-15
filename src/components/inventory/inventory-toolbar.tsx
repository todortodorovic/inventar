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
 * Search, category, stock level and sort. Desktop gets chips with counts;
 * phones get native selects, which open the system picker and never overflow.
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
        <ChipGroup
          label={dict.toolbar.level}
          value={filters.level}
          onChange={(v) => set("level", v)}
          options={levelOptions}
          className="hidden self-start lg:flex"
        />
        {/* Phones: category and stock level as two selects side by side. */}
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <NativeSelect
            aria-label={dict.toolbar.category}
            value={filters.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label={dict.toolbar.level}
            value={filters.level}
            onChange={(e) => set("level", e.target.value as Filters["level"])}
          >
            {levelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </NativeSelect>
        </div>
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
          <p className="text-sm text-ink-muted" aria-live="polite">
            {fill(dict.toolbar.shown, { articles: plural(t.units.articles, shown, locale) })}
          </p>
          {isFiltered(filters) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-[13px] font-semibold"
              onClick={() => onChange({ ...filters, query: "", category: ALL, level: ALL })}
            >
              <FilterXIcon aria-hidden />
              {dict.toolbar.clearFilters}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-sort`} className="text-[13px] font-semibold text-ink-soft">
            {dict.toolbar.sort}
          </label>
          <NativeSelect
            id={`${id}-sort`}
            value={filters.sort}
            onChange={(e) => set("sort", e.target.value as SortKey)}
            className="w-[210px]"
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
