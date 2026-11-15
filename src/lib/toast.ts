"use client"

import { useSyncExternalStore } from "react"

/**
 * A tiny toast queue. Call `toast("Sačuvano")` from any client component;
 * `<Toaster />` in the layout shows it for a few seconds. Pass `undo` to offer
 * a one-click undo.
 */

export type Toast = {
  id: number
  message: string
  tone: "default" | "error"
  action?: { label: string; onClick: () => void }
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function toast(message: string, options: { tone?: Toast["tone"]; action?: Toast["action"] } = {}) {
  const id = nextId++
  toasts = [...toasts.slice(-2), { id, message, tone: options.tone ?? "default", action: options.action }]
  emit()
  setTimeout(() => dismiss(id), options.action ? 6000 : 3500)
  return id
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
