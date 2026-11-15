"use client"

import {
  ClipboardCheckIcon,
  EllipsisIcon,
  HandCoinsIcon,
  HistoryIcon,
  PackagePlusIcon,
  PencilIcon,
  Trash2Icon,
  TruckIcon,
} from "lucide-react"
import Link from "next/link"
import { useApp } from "@/components/app/app-provider"
import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuLinkItem,
  MenuSeparator,
  MenuTrigger,
  useAfterMenuCloses,
} from "@/components/ui/menu"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill } from "@/lib/format"
import type { Article, Id } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"

export type ArticleAction = "sell" | "receive" | "edit" | "adjust" | "history" | "delete"

type Props = {
  article: Article
  dict: Dictionary["inventory"]
  onAction: (action: ArticleAction, article: Article) => void
}

/**
 * The first enabled button among an article's own actions (its table row or
 * its card, whichever is on screen), to put focus back there after a dialog.
 */
export function findArticleAction(id: Id): HTMLElement | undefined {
  const boxes = document.querySelectorAll<HTMLElement>(`[data-article-actions="${CSS.escape(id)}"]`)
  for (const box of boxes) {
    if (box.getClientRects().length === 0) continue
    const button = box.querySelector<HTMLElement>("button:not(:disabled)")
    if (button) return button
  }
}

/**
 * The actions in a desktop table row: one button, everything else in the ⋯
 * menu so the Artikal column keeps its width. The button is Prodaj, or Prijem
 * when nothing is left to sell (then Prijem leaves the menu). It stays the
 * same element, so focus stays on it after the last piece is sold.
 */
export function ArticleRowActions({ article, dict, onAction }: Props) {
  const soldOut = article.quantity === 0
  return (
    <div className="flex items-center justify-end gap-1" data-article-actions={article.id}>
      <Button
        variant="outline"
        className="h-8 gap-1.5 px-2.5 text-[13px]"
        onClick={() => onAction(soldOut ? "receive" : "sell", article)}
        aria-label={fill(soldOut ? dict.actions.receiveLabel : dict.actions.sellLabel, { name: article.name })}
      >
        {soldOut ? <PackagePlusIcon aria-hidden /> : <HandCoinsIcon aria-hidden />}
        {soldOut ? dict.actions.receiveShort : dict.actions.sell}
      </Button>
      <ArticleMenu article={article} dict={dict} onAction={onAction} withReceive={!soldOut} />
    </div>
  )
}

/**
 * The actions under a phone card: Prodaj and Prijem as a full-width 50/50
 * pair of 44px targets. Prodaj is the card's primary (graphite); with nothing
 * on the shelf it is disabled and Prijem, the only useful step, takes the
 * graphite. The rest lives in the ⋯ menu in the card's corner (`ArticleMenu size="lg"`).
 */
export function ArticleCardActions({ article, dict, onAction }: Props) {
  const soldOut = article.quantity === 0
  const button = "h-11 w-full gap-2 text-[14px]"
  return (
    <div className="grid grid-cols-2 gap-2" data-article-actions={article.id}>
      <Button
        variant={soldOut ? "outline" : "dark"}
        className={button}
        disabled={soldOut}
        onClick={() => onAction("sell", article)}
        aria-label={fill(dict.actions.sellLabel, { name: article.name })}
      >
        <HandCoinsIcon aria-hidden />
        {dict.actions.sell}
      </Button>
      <Button
        variant={soldOut ? "dark" : "outline"}
        className={button}
        onClick={() => onAction("receive", article)}
        aria-label={fill(dict.actions.receiveLabel, { name: article.name })}
      >
        <PackagePlusIcon aria-hidden />
        {dict.actions.receiveShort}
      </Button>
    </div>
  )
}

/** The ⋯ menu: its trigger names the article; the open menu shows it as a heading. */
export function ArticleMenu({
  article,
  dict,
  onAction,
  withReceive = false,
  size = "md",
  className,
}: Props & {
  /** Desktop rows show Prijem as a button only when sold out; otherwise it leads the menu. */
  withReceive?: boolean
  /** `lg`: a 44px target for phone cards. */
  size?: "md" | "lg"
  className?: string
}) {
  const { t, locale } = useApp()
  // Every item opens a dialog: wait for the menu to close so focus comes back to ⋯.
  const { later, onOpenChangeComplete } = useAfterMenuCloses<ArticleAction>((action) => onAction(action, article))
  // The shipments section reads `?new=` and opens a new shipment with this article in it.
  const shipHref = `${localePath(locale, "shipments")}?new=${encodeURIComponent(article.id)}`
  return (
    <Menu onOpenChangeComplete={onOpenChangeComplete}>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              size === "lg" ? "size-11 rounded-lg text-fg-muted" : "size-8 text-fg-muted",
              className,
            )}
            aria-label={fill(dict.actions.moreLabel, { name: article.name })}
          />
        }
      >
        <EllipsisIcon className={size === "lg" ? "size-5" : "size-[18px]"} aria-hidden />
      </MenuTrigger>
      <MenuContent>
        <MenuGroup>
          <MenuLabel>{article.name}</MenuLabel>
          {withReceive && (
            <MenuItem onClick={() => later("receive")}>
              <PackagePlusIcon aria-hidden />
              {dict.actions.receive}
            </MenuItem>
          )}
          {article.quantity > 0 ? (
            <MenuLinkItem render={<Link href={shipHref} />} closeOnClick>
              <TruckIcon aria-hidden />
              {dict.actions.ship}
            </MenuLinkItem>
          ) : (
            <MenuItem disabled>
              <TruckIcon aria-hidden />
              {dict.actions.ship}
            </MenuItem>
          )}
        </MenuGroup>
        <MenuSeparator />
        <MenuItem onClick={() => later("edit")}>
          <PencilIcon aria-hidden />
          {t.actions.edit}
        </MenuItem>
        <MenuItem onClick={() => later("adjust")}>
          <ClipboardCheckIcon aria-hidden />
          {dict.actions.adjust}
        </MenuItem>
        <MenuItem onClick={() => later("history")}>
          <HistoryIcon aria-hidden />
          {dict.actions.history}
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive" onClick={() => later("delete")}>
          <Trash2Icon aria-hidden />
          {t.actions.delete}
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
