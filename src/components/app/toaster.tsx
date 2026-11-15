"use client"

import { XIcon } from "lucide-react"
import { dismiss, useToasts } from "@/lib/toast"
import { cn } from "@/lib/utils"

/** Bottom-centre stack of toasts, above the mobile tab bar. */
export function Toaster({ closeLabel }: { closeLabel: string }) {
  const toasts = useToasts()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-60 flex flex-col items-center gap-2 px-4 min-[900px]:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex max-w-[min(100%,440px)] animate-in items-center gap-3 rounded-full py-2 pr-2 pl-[18px] text-sm font-medium shadow-[0_14px_34px_-14px_rgb(22_22_26/0.45)] duration-300 fade-in-0 slide-in-from-bottom-3",
            t.tone === "error" ? "bg-destructive text-white" : "bg-ink text-cream",
          )}
        >
          <span className="min-w-0 py-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action!.onClick()
                dismiss(t.id)
              }}
              className="rounded-full bg-white/14 px-3 py-1 font-semibold transition-colors hover:bg-white/24"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label={closeLabel}
            className="grid size-7 place-items-center rounded-full text-current/70 transition-colors hover:bg-white/14 hover:text-current"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
