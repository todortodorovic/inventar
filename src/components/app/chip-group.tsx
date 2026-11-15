"use client"

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type Chip<T extends string> = { value: T; label: ReactNode; count?: number }

/**
 * Single-choice filter (status, period, category…) as a segmented control:
 * a grey track, the chosen segment raised in white. It never pushes the page
 * wider: when the options do not fit (390px phones) the row scrolls sideways
 * and its edges fade where more options hide. Segments are 40px touch
 * targets on phones; on md+ the whole control is 36px, the height of a field.
 *
 * Keyboard: a radio group, so it is one tab stop (the chosen segment) and the
 * arrow keys (plus Home/End) move the choice, wrapping at the ends.
 */
export function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  /** Accessible name of the group. */
  label: string
  value: T
  onChange: (value: T) => void
  options: Chip<T>[]
  className?: string
}) {
  const scroller = useEdgeFade()
  const index = options.findIndex((o) => o.value === value)
  // The tab stop: the chosen segment, or the first one when nothing matches.
  const focusable = Math.max(0, index)

  function select(i: number, el: HTMLElement | undefined) {
    onChange(options[i].value)
    el?.focus()
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" })
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const radios = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'))
    const n = radios.length
    const from = Math.max(0, radios.indexOf(e.target as HTMLElement))
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : step !== undefined ? (from + step + n) % n : null
    if (next === null || n === 0) return
    e.preventDefault()
    select(next, radios[next])
  }

  return (
    <div className={cn("flex max-w-full min-w-0 rounded-lg bg-sunken-strong/70 p-[3px]", className)}>
      <div
        ref={scroller}
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="relative flex min-w-0 flex-1 gap-0.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start,0px),#000_calc(100%-var(--fade-end,0px)),transparent)] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((o, i) => {
          const checked = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={i === focusable ? 0 : -1}
              onClick={(e) => select(i, e.currentTarget)}
              className="group flex h-10 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap text-fg-muted transition-[color,background-color,box-shadow] outline-none hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-checked:bg-surface aria-checked:text-fg aria-checked:shadow-[0_1px_2px_rgb(17_21_28/0.1),0_0_0_1px_rgb(17_21_28/0.05)] md:h-[30px]"
            >
              {o.label}
              {o.count !== undefined && (
                <span className="text-[12px] font-medium text-fg-faint tabular-nums group-aria-checked:text-fg-muted">{o.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Sets `--fade-start` / `--fade-end` on a horizontal scroller to 20px on the
 * side(s) where content is hidden, 0 otherwise (read by its mask-image).
 */
function useEdgeFade() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      el.style.setProperty("--fade-start", el.scrollLeft > 1 ? "20px" : "0px")
      el.style.setProperty("--fade-end", el.scrollLeft < max - 1 ? "20px" : "0px")
    }
    update()
    // Start with the chosen option in view.
    const checked = el.querySelector<HTMLElement>("[aria-checked=true]")
    if (checked && el.scrollWidth > el.clientWidth) el.scrollLeft = Math.max(0, checked.offsetLeft - el.clientWidth / 2 + checked.offsetWidth / 2)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener("scroll", update, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener("scroll", update)
    }
  }, [])
  return ref
}
