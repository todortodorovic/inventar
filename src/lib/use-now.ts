"use client"

import { useSyncExternalStore } from "react"
import { toDateInput } from "./format"

/**
 * One shared "now" for the panels, so every range, "x days ago" and "today"
 * on a page agrees and doesn't shift under the seller while they work.
 *
 * It is `null` on the server and during hydration (like `useInventory()`), so
 * static prerendering never bakes the build's clock into the page. In the
 * browser it is read once and only moves forward when the local day changes
 * (checked every minute and when the tab comes back into view).
 */

let now: Date | null = null
const listeners = new Set<() => void>()

function getSnapshot(): Date {
  now ??= new Date()
  return now
}

const getServerSnapshot = () => null

function refreshIfNewDay() {
  const fresh = new Date()
  if (now && toDateInput(fresh.toISOString()) === toDateInput(now.toISOString())) return
  now = fresh
  for (const listener of listeners) listener()
}

function onVisibility() {
  if (document.visibilityState === "visible") refreshIfNewDay()
}

let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    timer = setInterval(refreshIfNewDay, 60_000)
    document.addEventListener("visibilitychange", onVisibility)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }
}

/** The page's "now", or `null` until the browser has rendered (render a skeleton first). */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
