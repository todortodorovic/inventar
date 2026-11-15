"use client"

import { BarChart3Icon } from "lucide-react"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { useApp } from "@/components/app/app-provider"
import { ChipGroup } from "@/components/app/chip-group"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { Panel } from "@/components/app/panel"
import { PanelSkeleton } from "@/components/app/skeleton"
import { buttonVariants } from "@/components/ui/button-variants"
import { localePath } from "@/config/site"
import type { Dictionary } from "@/content/types"
import {
  lowStockArticles,
  monthlySeries,
  openShipmentsSummary,
  periodKeys,
  periodRange,
  periodSummary,
  profitByCategory,
  recentActivity,
  salesIn,
  shipmentPipeline,
  stockSummary,
  topArticles,
  type PeriodKey,
} from "@/lib/inventory/stats"
import { useNow } from "@/lib/use-now"
import { useInventory } from "@/lib/inventory/store"
import { CategoryProfit } from "./category-profit"
import { KpiRow } from "./kpi-row"
import { LowStock } from "./low-stock"
import { MonthlyChart } from "./monthly-chart"
import { RecentActivity } from "./recent-activity"
import { ShipmentPipeline } from "./shipment-pipeline"
import { StockRow } from "./stock-row"
import { TopArticles } from "./top-articles"

/**
 * Pregled: the home page. One period filter at the top scopes the KPIs and
 * the breakdowns; the stock row is always "right now"; the monthly chart
 * keeps its 12 months and marks the ones in the period with a lime band.
 */
export function OverviewPanel({ dict }: { dict: Dictionary["overview"] }) {
  const { locale, t } = useApp()
  const state = useInventory()
  const [period, setPeriod] = useState<PeriodKey>("30d")
  // One "now" for the whole page, so every range and "x days ago" agrees.
  const now = useNow()

  const header = (
    <PageHeader
      title={dict.title}
      subtitle={dict.subtitle}
      actions={
        <ChipGroup<PeriodKey>
          label={dict.period.label}
          value={period}
          onChange={setPeriod}
          options={periodKeys.map((key) => ({
            value: key,
            // Short labels on phones so all five fit at 390px; the full one stays the accessible name.
            label: (
              <>
                <span className="sm:hidden" aria-hidden>
                  {dict.periodShort[key]}
                </span>
                <span className="max-sm:sr-only">{dict.period[key]}</span>
              </>
            ),
          }))}
        />
      }
    />
  )

  if (!state || !now) {
    return (
      <>
        {header}
        <PanelSkeleton label={t.loading} />
      </>
    )
  }

  if (state.articles.length === 0 && state.sales.length === 0 && state.shipments.length === 0) {
    return (
      <>
        <PageHeader title={dict.title} subtitle={dict.subtitle} />
        <Panel>
          <EmptyState
            icon={BarChart3Icon}
            title={dict.empty.title}
            description={dict.empty.description}
            action={
              <Link href={localePath(locale, "inventory")} className={buttonVariants({ variant: "primary", size: "cta" })}>
                {dict.empty.action}
              </Link>
            }
          />
        </Panel>
      </>
    )
  }

  const { current, previous } = periodRange(period, now)
  const sales = salesIn(state, current)
  const months = monthlySeries(state, now)

  return (
    <>
      {header}
      <div className="flex flex-col gap-7">
        <Group id="overview-period" label={dict.groups.period[period]}>
          <KpiRow
            dict={dict}
            period={period}
            current={periodSummary(state, current)}
            previous={previous && periodSummary(state, previous)}
            months={months}
          />
        </Group>

        <Group id="overview-now" label={dict.groups.now}>
          <StockRow dict={dict} stock={stockSummary(state)} open={openShipmentsSummary(state)} />
        </Group>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <MonthlyChart dict={dict.chart} points={months} range={current} />
          </div>
          <div className="min-w-0 lg:col-span-4">
            <CategoryProfit dict={dict.categories} rows={profitByCategory(sales)} />
          </div>
          <div className="min-w-0 lg:col-span-7">
            <TopArticles dict={dict.top} rows={topArticles(state, sales)} />
          </div>
          <div className="min-w-0 lg:col-span-5">
            <ShipmentPipeline dict={dict.pipeline} pipeline={shipmentPipeline(state, current)} />
          </div>
          <div className="min-w-0 lg:col-span-5">
            <LowStock dict={dict.lowStock} articles={lowStockArticles(state, locale)} />
          </div>
          <div className="min-w-0 lg:col-span-7">
            <RecentActivity dict={dict.activity} events={recentActivity(state)} now={now} />
          </div>
        </div>
      </div>
    </>
  )
}

/** A labelled band of tiles: a small eyebrow with a hairline, content below. */
function Group({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h2 id={id} className="flex items-center gap-3 type-overline">
        {label}
        <span className="h-px flex-1 bg-hairline" aria-hidden />
      </h2>
      {children}
    </section>
  )
}
