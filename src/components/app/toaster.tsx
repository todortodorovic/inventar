"use client"

import { CircleAlertIcon, XIcon } from "lucide-react"
import { useEffect, useRef, type FocusEvent, type KeyboardEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { dismiss, pauseToasts, resumeToasts, useToasts } from "@/lib/toast"
import { cn } from "@/lib/utils"

/** Keyboard shortcut that jumps to the newest toast (Option+T on a Mac). */
const SHORTCUT = "Alt+T"

/**
 * Bottom-centre stack of toasts, above the mobile tab bar. Toasts wait while
 * the pointer or focus is on them, and Alt+T moves focus to the newest one
 * (its Undo, if it has one) from anywhere; Escape closes it and focus goes
 * back where it was.
 */
export function Toaster() {
  const { t } = useApp()
  const toasts = useToasts()
  const region = useRef<HTMLElement>(null)
  // Where focus was before Alt+T, to return to once the toast is done.
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.code !== "KeyT") return
      const target = region.current?.querySelector<HTMLElement>("[data-toast]:last-child button")
      if (!target) return
      e.preventDefault()
      if (!region.current?.contains(document.activeElement)) {
        returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      }
      target.focus()
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [])

  // Releases a paused stack once the last toast is gone (focus leaves with it).
  useEffect(() => {
    if (toasts.length === 0) resumeToasts()
  }, [toasts.length])

  function close(id: number) {
    dismiss(id)
    const back = returnTo.current
    returnTo.current = null
    // Focus going back fires the stack's blur, which resumes it; otherwise resume here.
    if (back?.isConnected) back.focus()
    else if (!region.current?.matches(":hover")) resumeToasts()
  }

  function onBlur(e: FocusEvent<HTMLElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      returnTo.current = null
      if (!e.currentTarget.matches(":hover")) resumeToasts()
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>, id: number) {
    if (e.key !== "Escape") return
    e.preventDefault()
    close(id)
  }

  return (
    <section
      ref={region}
      aria-label={`${t.toasts.label} (${SHORTCUT})`}
      aria-live="polite"
      onMouseEnter={pauseToasts}
      onMouseLeave={(e) => {
        if (!e.currentTarget.contains(document.activeElement)) resumeToasts()
      }}
      onFocus={pauseToasts}
      onBlur={onBlur}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h)+12px+env(safe-area-inset-bottom))] z-60 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:pl-[calc(var(--sidebar-w)+16px)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-toast
          role={toast.tone === "error" ? "alert" : "status"}
          onKeyDown={(e) => onKeyDown(e, toast.id)}
          className={cn(
            "pointer-events-auto flex max-w-[min(100%,460px)] animate-in items-center gap-2.5 rounded-lg py-1.5 pr-1.5 pl-3.5 text-[13.5px] font-medium shadow-pop ring-1 duration-300 fade-in-0 slide-in-from-bottom-2",
            toast.tone === "error" ? "bg-danger text-fg-inverse ring-black/10" : "bg-graphite-900 text-fg-inverse ring-white/10",
          )}
        >
          {toast.tone === "error" && <CircleAlertIcon className="size-4 shrink-0 opacity-90" aria-hidden />}
          <span className="min-w-0 py-1">
            {toast.message}
            {toast.action && <span className="sr-only"> {t.toasts.actionHint}</span>}
          </span>
          {toast.action && (
            <button
              type="button"
              aria-keyshortcuts={SHORTCUT}
              onClick={() => {
                toast.action!.onClick()
                close(toast.id)
              }}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 font-semibold whitespace-nowrap transition-colors outline-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-on-dark",
                toast.tone === "error" ? "text-fg-inverse underline underline-offset-2" : "text-accent-on-dark",
              )}
            >
              {toast.action.label}
            </button>
          )}
          <span className="h-4 w-px bg-white/15" aria-hidden />
          <button
            type="button"
            onClick={() => close(toast.id)}
            aria-label={t.actions.close}
            className="grid size-7 place-items-center rounded-md text-current/70 transition-colors outline-none hover:bg-white/10 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-on-dark"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
    </section>
  )
}
