"use client"

import { ChevronsUpDownIcon, DatabaseZapIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/components/app/app-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { inventory } from "@/lib/inventory/store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

/**
 * The "Demo" control (phone top bar: a light chip, 40px tall on phones;
 * graphite sidebar: a full-width row):
 * explains that data lives only in this tab, and lets the visitor restore
 * the demo data or start empty.
 */
export function DemoMenu({ layout = "chip" }: { layout?: "chip" | "row" }) {
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
            className={cn(
              "flex items-center gap-2 rounded-lg text-[12.5px] font-semibold transition-colors outline-none focus-visible:outline-2",
              layout === "row"
                ? "h-[34px] min-w-0 flex-1 px-2.5 text-sidebar-fg-muted hover:bg-graphite-800 hover:text-sidebar-fg focus-visible:outline-offset-0 focus-visible:outline-accent-on-dark"
                : "h-10 border border-hairline-strong bg-surface px-2.5 text-fg-soft shadow-xs hover:border-fg-faint/40 hover:text-fg focus-visible:outline-offset-2 focus-visible:outline-ring md:h-[34px]",
            )}
          />
        }
      >
        <span className="relative grid size-2 place-items-center" aria-hidden>
          <span className="absolute size-2.5 rounded-full bg-status-pending/30" />
          <span className="size-1.5 rounded-full bg-status-pending" />
        </span>
        <span className="truncate">{t.demo.badge}</span>
        {layout === "row" && <ChevronsUpDownIcon className="ml-auto size-3.5 shrink-0 text-sidebar-fg-faint" aria-hidden />}
      </DialogTrigger>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 grid size-10 place-items-center rounded-lg bg-sunken text-fg-soft ring-1 ring-hairline ring-inset">
            <DatabaseZapIcon className="size-5" aria-hidden />
          </span>
          <DialogTitle>{t.demo.badge}</DialogTitle>
          <DialogDescription>{t.demo.notice}</DialogDescription>
        </DialogHeader>

        {confirm ? (
          <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-sunken p-4">
            <p className="text-sm text-fg-soft">{confirm === "reset" ? t.demo.confirmReset : t.demo.confirmClear}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="cta" onClick={() => setConfirm(null)}>
                {t.actions.cancel}
              </Button>
              <Button
                variant={confirm === "clear" ? "destructive" : "primary"}
                size="cta"
                onClick={() => run(confirm)}
              >
                {t.actions.confirm}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="cta" className="sm:flex-1" onClick={() => setConfirm("reset")}>
              <RotateCcwIcon data-icon="inline-start" />
              {t.demo.reset}
            </Button>
            <Button variant="destructive" size="cta" className="sm:flex-1" onClick={() => setConfirm("clear")}>
              <Trash2Icon data-icon="inline-start" />
              {t.demo.clear}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
