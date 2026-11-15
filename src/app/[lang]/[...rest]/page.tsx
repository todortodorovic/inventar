import { notFound } from "next/navigation"

// Always a 404, so there is no instant UI to validate.
export const instant = false

/**
 * Any address under a locale that no section matches (`/nepostoji`,
 * `/en/nope`, `/inventory/x`) lands here, so the 404 renders inside the app
 * shell from `../not-found.tsx`, in the right language. Every other path is
 * rewritten into a locale (next.config.ts), so nothing falls outside it.
 */
export default function CatchAll() {
  notFound()
}
