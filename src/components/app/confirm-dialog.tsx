"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useApp } from "@/components/app/app-provider"

/** "Are you sure?" for anything that deletes or overwrites. Controlled. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  const { t } = useApp()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.actions.close} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="cta" onClick={() => onOpenChange(false)}>
            {t.actions.cancel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            size="cta"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
