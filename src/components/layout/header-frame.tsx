"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * The fixed header shell. Its only job is to flip `data-scrolled` once the
 * page moves; every visual change is a CSS variant on that attribute, so the
 * header content stays a server component and nothing re-renders on scroll.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      el.toggleAttribute("data-scrolled", window.scrollY > 40)
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
      className="group/header fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-[18px] transition-[padding] duration-400 ease-soft data-scrolled:px-4 data-scrolled:pt-2.5 sm:px-6"
    >
      {children}
    </header>
  )
}
