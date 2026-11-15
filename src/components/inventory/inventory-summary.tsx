"use client"

import { useApp } from "@/components/app/app-provider"
import { StatTile } from "@/components/app/stat-tile"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatNumber, plural } from "@/lib/format"
import type { Totals } from "./filters"

/** Amounts are long ("468.000 RSD"), so they step down a size in the two-column phone grid. */
function Money({ amount }: { amount: number }) {
  const { locale } = useApp()
  return <span className="text-[20px] sm:text-[length:inherit]">{formatMoney(amount, locale)}</span>
}

/** Headline numbers for everything on the shelf (not just what the filters show). */
export function InventorySummary({
  totals,
  piecesInShipments,
  dict,
}: {
  totals: Totals
  piecesInShipments: number
  dict: Dictionary["inventory"]
}) {
  const { t, locale } = useApp()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label={dict.summary.articles}
        value={formatNumber(totals.articles, locale)}
        hint={fill(dict.summary.articlesHint, { pieces: plural(t.units.pieces, totals.pieces, locale) })}
        accent="var(--chart-3)"
      />
      <StatTile
        label={dict.summary.cost}
        value={<Money amount={totals.cost} />}
        hint={dict.summary.costHint}
        accent="var(--chart-4)"
      />
      <StatTile
        label={dict.summary.value}
        value={<Money amount={totals.value} />}
        hint={dict.summary.valueHint}
        accent="var(--chart-1)"
      />
      <StatTile
        label={dict.summary.profit}
        value={<Money amount={totals.profit} />}
        tone={totals.profit < 0 ? "loss" : "gain"}
        hint={
          piecesInShipments > 0
            ? fill(dict.summary.inShipments, { pieces: plural(t.units.pieces, piecesInShipments, locale) })
            : dict.summary.noneInShipments
        }
        accent="var(--chart-2)"
      />
    </div>
  )
}
