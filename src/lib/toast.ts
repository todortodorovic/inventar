"use client"

import { useSyncExternalStore } from "react"

/**
 * A tiny toast queue. Call `toast("Sačuvano")` from any client component;
 * `<Toaster />` in the layout shows it for a few seconds. Pass `action` to
 * offer a one-click undo: those toasts stay longer, and every toast waits
 * while the pointer or keyboard focus is on the stack (`pauseToasts`).
 */

export type Toast = {
  id: number
  message: string
  tone: "default" | "error"
  action?: { label: string; onClick: () => void }
}

/** How long a toast stays, in ms. An undo needs time to read and reach. */
const DURATION = 4000
const ACTION_DURATION = 10000
/** After a pause, a toast stays at least this long. */
const MIN_AFTER_PAUSE = 2000

let toasts: Toast[] = []
let nextId = 1
let paused = false
const timers = new Map<number, { handle?: ReturnType<typeof setTimeout>; remaining: number; started: number }>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function startTimer(id: number) {
  const timer = timers.get(id)
  if (!timer || paused) return
  timer.started = Date.now()
  timer.handle = setTimeout(() => dismiss(id), timer.remaining)
}

function clearTimer(id: number) {
  clearTimeout(timers.get(id)?.handle)
  timers.delete(id)
}

export function dismiss(id: number) {
  clearTimer(id)
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function toast(message: string, options: { tone?: Toast["tone"]; action?: Toast["action"] } = {}) {
  const id = nextId++
  // At most three on screen: the oldest makes room.
  for (const old of toasts.slice(0, -2)) clearTimer(old.id)
  toasts = [...toasts.slice(-2), { id, message, tone: options.tone ?? "default", action: options.action }]
  timers.set(id, { remaining: options.action ? ACTION_DURATION : DURATION, started: 0 })
  startTimer(id)
  emit()
  return id
}

/** Hold every toast on screen (pointer over the stack, or focus inside it). */
export function pauseToasts() {
  if (paused) return
  paused = true
  const now = Date.now()
  for (const timer of timers.values()) {
    clearTimeout(timer.handle)
    timer.handle = undefined
    timer.remaining = Math.max(MIN_AFTER_PAUSE, timer.remaining - (now - timer.started))
  }
}

export function resumeToasts() {
  if (!paused) return
  paused = false
  for (const id of timers.keys()) startTimer(id)
}

const empty: Toast[] = []

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => toasts,
    () => empty,
  )
}
