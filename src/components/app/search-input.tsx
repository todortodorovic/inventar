"use client"

import { SearchIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Search field with a magnifier and a clear button. Controlled. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  clearLabel,
  className,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  clearLabel: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="h-10 w-full min-w-0 rounded-md border border-input bg-surface pr-9 pl-9 text-base shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-fg-faint hover:border-fg-faint/40 focus-visible:border-fg-soft focus-visible:ring-3 focus-visible:ring-fg/10 md:h-9 md:text-[13.5px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-sm text-fg-muted transition-colors outline-none hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-ring md:size-6"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}
