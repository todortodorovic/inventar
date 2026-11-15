"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * The "⋯" action menu (Base UI Menu) used on article rows/cards and shipment
 * cards: a white popover, items with an icon and their name, 44px targets on
 * phones, and red (`variant="destructive"`) items after a separator.
 */
const Menu = MenuPrimitive.Root
const MenuTrigger = MenuPrimitive.Trigger
const MenuGroup = MenuPrimitive.Group

function MenuContent({
  side = "bottom",
  align = "end",
  className,
  children,
}: {
  side?: "top" | "bottom"
  align?: "start" | "end"
  className?: string
  children: ReactNode
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner side={side} align={align} sideOffset={6} collisionPadding={12} className="z-50 outline-none">
        <MenuPrimitive.Popup
          className={cn(
            "max-w-[min(300px,calc(100vw-32px))] min-w-[220px] origin-(--transform-origin) rounded-lg border border-hairline bg-popover p-1 text-popover-foreground shadow-pop outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

const itemClass =
  "flex min-h-11 cursor-default items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium text-fg-soft outline-none select-none data-disabled:opacity-45 data-highlighted:bg-sunken data-highlighted:text-fg md:min-h-9 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-faint data-highlighted:[&_svg]:text-fg-soft"

const destructiveClass =
  "text-danger-ink data-highlighted:bg-danger-soft data-highlighted:text-danger-ink [&_svg]:text-danger data-highlighted:[&_svg]:text-danger-ink"

function MenuItem({
  variant = "default",
  className,
  ...props
}: MenuPrimitive.Item.Props & { variant?: "default" | "destructive" }) {
  return <MenuPrimitive.Item className={cn(itemClass, variant === "destructive" && destructiveClass, className)} {...props} />
}

function MenuLinkItem({ className, ...props }: MenuPrimitive.LinkItem.Props) {
  return <MenuPrimitive.LinkItem className={cn(itemClass, className)} {...props} />
}

/** A small heading inside a `MenuGroup`, e.g. the article the menu acts on. */
function MenuLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn("truncate px-2.5 pt-1.5 pb-1 text-[12px] font-medium text-fg-muted", className)}
      {...props}
    />
  )
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-hairline", className)} {...props} />
}

/**
 * Runs a chosen command only after the menu has closed and handed focus back
 * to its trigger, so a dialog it opens returns focus there (not to <body>)
 * when it closes. Spread `onOpenChangeComplete` on `<Menu>`; call `later(v)`
 * from an item. Work that must stay inside the click (clipboard writes in
 * Safari) should be run directly instead.
 */
function useAfterMenuCloses<T>(run: (value: T) => void) {
  const pending = useRef<{ value: T } | null>(null)
  return {
    later: (value: T) => {
      pending.current = { value }
    },
    onOpenChangeComplete: (open: boolean) => {
      const next = pending.current
      pending.current = null
      if (!open && next) run(next.value)
    },
  }
}

export { Menu, MenuTrigger, MenuGroup, MenuContent, MenuItem, MenuLinkItem, MenuLabel, MenuSeparator, useAfterMenuCloses }
