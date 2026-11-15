"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-[rgb(11_14_20/0.36)] duration-200 supports-backdrop-filter:backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel = "Close",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /** Screen-reader label of the × button; pass `t.actions.close`. */
  closeLabel?: string
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Phones: a sheet from the bottom edge. From 640px: a centred card.
          "fixed inset-x-0 bottom-0 z-50 grid max-h-[92svh] w-full gap-5 overflow-y-auto overscroll-contain rounded-t-[16px] bg-popover px-4 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))] text-sm text-popover-foreground shadow-dialog duration-300 ease-soft outline-none data-open:animate-in data-open:slide-in-from-bottom-8 data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-8",
          // The grab handle that says "this is a sheet" on phones.
          "before:absolute before:top-2 before:left-1/2 before:h-1 before:w-9 before:-translate-x-1/2 before:rounded-full before:bg-fg/12 sm:before:hidden",
          "sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[min(88svh,860px)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-(--radius-dialog) sm:p-6 sm:ring-1 sm:ring-fg/8 sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-[0.97] sm:data-closed:slide-out-to-bottom-0 sm:data-closed:zoom-out-[0.97]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3 text-fg-muted sm:top-4 sm:right-4"
                size="icon"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1 pr-8", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky -bottom-[calc(16px+env(safe-area-inset-bottom))] z-10 -mx-4 -mb-[calc(16px+env(safe-area-inset-bottom))] mt-1 flex flex-col-reverse gap-2 border-t border-hairline bg-surface-subtle px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:flex-row sm:items-center sm:justify-end sm:rounded-b-(--radius-dialog) sm:px-6 sm:py-3.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-[17px] leading-6 font-semibold tracking-[-0.012em] text-balance",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-[13.5px] leading-normal text-fg-muted text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
