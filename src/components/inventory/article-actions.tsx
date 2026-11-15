"use client"

import { Menu } from "@base-ui/react/menu"
import {
  ClipboardCheckIcon,
  EllipsisIcon,
  HandCoinsIcon,
  HistoryIcon,
  PackagePlusIcon,
  PencilIcon,
  Trash2Icon,
  TruckIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { useApp } from "@/components/app/app-provider"
import { Button } from "@/components/ui/button"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill } from "@/lib/format"
import type { Article } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

export type ArticleAction = "sell" | "receive" | "edit" | "adjust" | "history" | "delete"

type Props = {
  article: Article
  dict: Dictionary["inventory"]
  onAction: (action: ArticleAction, article: Article) => void
  /** `row`: compact, for the desktop table. `card`: full-width 40px targets for phones. */
  layout: "row" | "card"
}

/** Sell and receive up front; everything else in the ⋯ menu. */
export function ArticleActions({ article, dict, onAction, layout }: Props) {
  const card = layout === "card"
  const button = card ? "h-10 flex-1 rounded-full text-[14px]" : "h-8 rounded-full px-3 text-[13px]"
  return (
    <div className={cn("flex items-center", card ? "gap-2" : "justify-end gap-1")}>
      <Button
        variant="outline"
        className={cn(button, "gap-1.5 font-semibold")}
        disabled={article.quantity === 0}
        onClick={() => onAction("sell", article)}
        aria-label={fill(dict.actions.sellLabel, { name: article.name })}
      >
        <HandCoinsIcon aria-hidden />
        {dict.actions.sell}
      </Button>
      <Button
        variant="ghost"
        className={cn(button, "gap-1.5 font-semibold", card && "bg-sand")}
        onClick={() => onAction("receive", article)}
        aria-label={fill(dict.actions.receiveLabel, { name: article.name })}
      >
        <PackagePlusIcon aria-hidden />
        {/* Icon only in a tight table; the aria-label still names it. */}
        <span className={card ? undefined : "hidden xl:inline"}>{dict.actions.receiveShort}</span>
      </Button>
      <ArticleMenu article={article} dict={dict} onAction={onAction} large={card} />
    </div>
  )
}

const itemClass =
  "flex min-h-10 cursor-default items-center gap-2.5 rounded-xl px-3 text-[14px] font-medium outline-none select-none data-disabled:opacity-45 data-highlighted:bg-ink/6 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-muted"

function Item({
  icon: Icon,
  children,
  onClick,
  disabled,
  destructive,
}: {
  icon: LucideIcon
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <Menu.Item
      onClick={onClick}
      disabled={disabled}
      className={cn(itemClass, destructive && "text-destructive [&_svg]:text-destructive data-highlighted:bg-destructive/8")}
    >
      <Icon aria-hidden />
      {children}
    </Menu.Item>
  )
}

function ArticleMenu({
  article,
  dict,
  onAction,
  large,
}: Omit<Props, "layout"> & { large: boolean }) {
  const { t, locale } = useApp()
  // The shipments section reads `?new=` and opens a new shipment with this article in it.
  const shipHref = `${localePath(locale, "shipments")}?new=${encodeURIComponent(article.id)}`
  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full", large ? "size-10 bg-sand" : "size-8")}
            aria-label={fill(dict.actions.moreLabel, { name: article.name })}
          />
        }
      >
        <EllipsisIcon className="size-[18px]" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50 outline-none">
          <Menu.Popup className="min-w-[210px] origin-(--transform-origin) rounded-2xl border border-line bg-popover p-1.5 shadow-[0_18px_44px_-16px_rgb(22_22_26/0.35)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Item icon={PencilIcon} onClick={() => onAction("edit", article)}>
              {t.actions.edit}
            </Item>
            <Item icon={ClipboardCheckIcon} onClick={() => onAction("adjust", article)}>
              {dict.actions.adjust}
            </Item>
            <Item icon={HistoryIcon} onClick={() => onAction("history", article)}>
              {dict.actions.history}
            </Item>
            {article.quantity > 0 ? (
              <Menu.LinkItem render={<Link href={shipHref} />} closeOnClick className={itemClass}>
                <TruckIcon aria-hidden />
                {dict.actions.ship}
              </Menu.LinkItem>
            ) : (
              <Item icon={TruckIcon} onClick={() => {}} disabled>
                {dict.actions.ship}
              </Item>
            )}
            <Menu.Separator className="mx-2 my-1 h-px bg-line" />
            <Item icon={Trash2Icon} onClick={() => onAction("delete", article)} destructive>
              {t.actions.delete}
            </Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
