"use client"

import { DatabaseZapIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { inventory } from "@/lib/inventory/store"
import { toast } from "@/lib/toast"

/**
 * The "Demo" chip in the header: explains that data lives only in this tab,
 * and lets the visitor restore the demo data or start empty.
 */
export function DemoMenu() {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null)

  function run(kind: "reset" | "clear") {
    if (kind === "reset") inventory.resetDemo()
    else inventory.clear()
    setConfirm(null)
    setOpen(false)
    toast(kind === "reset" ? t.demo.reset : t.demo.clear)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setConfirm(null)
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-line-strong bg-white px-3 py-[7px] font-mono text-[11px] font-semibold tracking-[0.14em] text-ink-soft uppercase transition-colors hover:text-ink"
          />
        }
      >
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-pop/60 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-pop" />
        </span>
        {t.demo.badge}
      </DialogTrigger>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 grid size-11 place-items-center rounded-2xl bg-sand text-ink">
            <DatabaseZapIcon className="size-5" aria-hidden />
          </span>
          <DialogTitle>{t.demo.badge}</DialogTitle>
          <DialogDescription>{t.demo.notice}</DialogDescription>
        </DialogHeader>

        {confirm ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-sand p-4">
            <p className="text-[15px] text-ink-soft">{confirm === "reset" ? t.demo.confirmReset : t.demo.confirmClear}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="cta" className="rounded-full" onClick={() => setConfirm(null)}>
                {t.actions.cancel}
              </Button>
              <Button
                variant={confirm === "clear" ? "destructive" : "brand"}
                size="cta"
                className="rounded-full"
                onClick={() => run(confirm)}
              >
                {t.actions.confirm}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="cta" className="flex-1 rounded-full" onClick={() => setConfirm("reset")}>
              <RotateCcwIcon data-icon="inline-start" />
              {t.demo.reset}
            </Button>
            <Button variant="destructive" size="cta" className="flex-1 rounded-full" onClick={() => setConfirm("clear")}>
              <Trash2Icon data-icon="inline-start" />
              {t.demo.clear}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
