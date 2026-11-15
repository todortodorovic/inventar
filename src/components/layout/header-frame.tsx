"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * The phone top bar. Its only job is to flip `data-scrolled` once the page
 * moves (a hairline and a frosted fill appear); every visual change is a CSS
 * variant on that attribute, so nothing re-renders on scroll.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      el.toggleAttribute("data-scrolled", window.scrollY > 4)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    addEventListener("scroll", onScroll, { passive: true })
    return () => {
      removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <header
      ref={ref}
      className="sticky top-0 z-30 flex h-(--topbar-h) items-center justify-between gap-3 border-b border-transparent bg-canvas/85 px-4 backdrop-blur-md backdrop-saturate-150 transition-colors duration-200 data-scrolled:border-hairline data-scrolled:bg-surface/90 sm:px-6 lg:hidden"
    >
      {children}
    </header>
  )
}
