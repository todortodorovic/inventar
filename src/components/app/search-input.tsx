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
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="h-10 w-full min-w-0 rounded-full border border-input bg-white pr-10 pl-10 text-base transition-colors outline-none placeholder:text-ink-faint focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/6 hover:text-ink"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  )
}
