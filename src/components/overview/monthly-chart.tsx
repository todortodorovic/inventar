"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { ChipGroup } from "@/components/app/chip-group"
import { Panel, PanelHeader } from "@/components/app/panel"
import { siteConfig, type Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatMoneyCompact, formatMonth, formatNumber } from "@/lib/format"
import type { DateRange, MonthPoint } from "@/lib/inventory/stats"
import { cn } from "@/lib/utils"
import { PanelEmpty } from "./figures"

/**
 * Revenue and net profit per month as grouped columns on one money axis.
 * Hand-drawn SVG sized to its container in pixels (so text never scales),
 * a tooltip per month on hover and keyboard focus, and the same numbers as a
 * table (visible on request, otherwise for screen readers only).
 */

const PLOT_H = 232
const TOP = 14
const AXIS_H = 36
const MAX_BAR = 24
const GAP = 2
const RADIUS = 4
const TIP_W = 176

const series = [
  { key: "revenue", color: "var(--chart-1)" },
  { key: "profit", color: "var(--chart-2)" },
] as const

type View = "chart" | "table"

export function MonthlyChart({
  dict,
  points,
  range,
}: {
  dict: Dictionary["overview"]["chart"]
  points: MonthPoint[]
  /** The selected period: months outside it are drawn quieter. */
  range: DateRange
}) {
  const { locale } = useApp()
  const [view, setView] = useState<View>("chart")
  const [active, setActive] = useState<number | null>(null)
  const last = points.length - 1
  const shown = active ?? last
  const allInRange = range.start === null

  return (
    <Panel className="flex h-full min-w-0 flex-col">
      <PanelHeader
        title={dict.title}
        description={allInRange ? dict.descriptionShort : dict.description}
        actions={
          points.length > 0 && (
            <ChipGroup<View>
              label={dict.view}
              value={view}
              onChange={setView}
              options={[
                { value: "chart", label: dict.viewChart },
                { value: "table", label: dict.viewTable },
              ]}
            />
          )
        }
      />
      {points.length === 0 ? (
        <PanelEmpty>{dict.empty}</PanelEmpty>
      ) : (
        <>
          {view === "chart" && (
            <>
              {/* Legend that doubles as the direct label: the hovered (or latest) month's values. */}
              <div className="flex flex-wrap items-end gap-x-6 gap-y-2 px-5 pt-4 sm:px-6" aria-hidden>
                {series.map((s) => (
                  <div key={s.key} className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2 text-[13px] text-ink-muted">
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                      {s.key === "revenue" ? dict.revenue : dict.profit}
                    </span>
                    <span className="font-display text-xl leading-none font-semibold tracking-[-0.03em]">
                      {formatMoney(points[shown][s.key], locale)}
                    </span>
                  </div>
                ))}
                <span className="ml-auto pb-0.5 font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
                  {formatMonth(points[shown].month, locale, "long")}
                </span>
              </div>
              <Plot points={points} range={range} dict={dict} locale={locale} active={active} onActive={setActive} />
            </>
          )}
          <MonthTable points={points} dict={dict} locale={locale} visible={view === "table"} />
        </>
      )}
    </Panel>
  )
}

function Plot({
  points,
  range,
  dict,
  locale,
  active,
  onActive,
}: {
  points: MonthPoint[]
  range: DateRange
  dict: Dictionary["overview"]["chart"]
  locale: Locale
  active: number | null
  onActive: (i: number | null) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [focused, setFocused] = useState<number | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Y scale: one money axis for both series, zero included, negative profit allowed.
  const hi = Math.max(0, ...points.map((p) => Math.max(p.revenue, p.profit)))
  const lo = Math.min(0, ...points.map((p) => p.profit))
  const step = niceStep((hi - lo) / 4)
  const yMin = Math.floor(lo / step) * step
  const yMax = Math.max(step, Math.ceil(hi / step) * step)
  const ticks: number[] = []
  for (let v = yMin; v <= yMax + step / 2; v += step) ticks.push(v)
  const tickLabels = ticks.map((v) => formatMoneyCompact(v, locale))

  const left = Math.max(...tickLabels.map((l) => l.length)) * 6.6 + 14
  const plotW = Math.max(0, width - left - 4)
  const band = points.length > 0 ? plotW / points.length : 0
  const barW = Math.max(3, Math.min(MAX_BAR, (band * 0.72 - GAP) / 2))
  const y = (v: number) => TOP + ((yMax - v) / (yMax - yMin)) * PLOT_H
  const zero = y(0)
  const labelEvery = band < 30 ? 2 : 1
  const monthName = new Intl.DateTimeFormat(siteConfig.localeTags[locale], { month: "short" })

  const inPeriod = (p: MonthPoint) => {
    const end = new Date(p.month.getFullYear(), p.month.getMonth() + 1, 1).getTime()
    return (range.start === null || end > range.start) && p.month.getTime() < range.end
  }

  function onKeyDown(e: KeyboardEvent<SVGGElement>) {
    const next =
      e.key === "ArrowRight" ? e.currentTarget.nextElementSibling : e.key === "ArrowLeft" ? e.currentTarget.previousElementSibling : null
    if (next instanceof SVGGElement) {
      e.preventDefault()
      next.focus()
    }
  }

  // The tooltip sits at the top of the plot beside the month, so it never covers that month's bars.
  const tip = active !== null && width > 0 ? points[active] : null
  const tipX = active !== null ? left + band * (active + 0.5) : 0
  const tipRight = tipX + band / 2 + TIP_W + 8 <= width

  return (
    <div className="px-3 pt-3 pb-4 sm:px-4">
      <div ref={box} className="relative" style={{ height: TOP + PLOT_H + AXIS_H }}>
        <style>{`
          @keyframes overview-grow { from { transform: scaleY(0) } }
          .overview-bar { transform-box: fill-box; transform-origin: 50% 100%; animation: overview-grow 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
          .overview-bar[data-negative] { transform-origin: 50% 0; }
          @media (prefers-reduced-motion: reduce) { .overview-bar { animation: none; } }
        `}</style>
        {width > 0 && (
          <svg
            width={width}
            height={TOP + PLOT_H + AXIS_H}
            role="group"
            aria-label={dict.caption}
            className="block overflow-visible"
            onPointerLeave={(e) => {
              // On touch the pointer "leaves" right after the tap; keep the tapped month shown.
              if (e.pointerType === "mouse") onActive(null)
            }}
          >
            {ticks.map((v, i) => (
              <g key={v}>
                <line
                  x1={left}
                  x2={width}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={v === 0 ? "var(--line-strong)" : "var(--line)"}
                  shapeRendering="crispEdges"
                />
                <text
                  x={left - 10}
                  y={y(v)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-ink-muted font-mono text-[11px] tabular-nums"
                >
                  {tickLabels[i]}
                </text>
              </g>
            ))}

            <g>
              {points.map((p, i) => {
                const x0 = left + band * i
                const cx = x0 + band / 2
                const quiet = !inPeriod(p)
                const isActive = active === i
                return (
                  <g
                    key={p.month.getTime()}
                    tabIndex={0}
                    role="img"
                    aria-label={fill(dict.pointLabel, {
                      month: formatMonth(p.month, locale, "long"),
                      revenue: formatMoney(p.revenue, locale),
                      profit: formatMoney(p.profit, locale),
                    })}
                    className="outline-none"
                    onPointerEnter={() => onActive(i)}
                    onFocus={(e) => {
                      onActive(i)
                      if (e.currentTarget.matches(":focus-visible")) setFocused(i)
                    }}
                    onBlur={() => {
                      onActive(null)
                      setFocused(null)
                    }}
                    onKeyDown={onKeyDown}
                  >
                    {/* The whole column is the hit target, not just the painted bars. */}
                    <rect
                      x={x0 + 1}
                      y={TOP - 6}
                      width={Math.max(0, band - 2)}
                      height={PLOT_H + 12}
                      rx={10}
                      fill="var(--ink)"
                      fillOpacity={isActive ? 0.045 : 0}
                      stroke={focused === i ? "var(--ring)" : "none"}
                      strokeWidth={2}
                      className="transition-[fill-opacity] duration-150"
                    />
                    {series.map((s, k) => {
                      const v = p[s.key]
                      const x = cx - barW - GAP / 2 + k * (barW + GAP)
                      return (
                        v !== 0 && (
                          <path
                            key={s.key}
                            d={columnPath(x, barW, zero, y(v))}
                            fill={s.color}
                            data-negative={v < 0 || undefined}
                            className="overview-bar transition-opacity duration-300"
                            style={{ animationDelay: `${i * 35 + k * 60}ms`, opacity: quiet ? 0.32 : 1 }}
                          />
                        )
                      )
                    })}
                    {i % labelEvery === (points.length - 1) % labelEvery && (
                      <text
                        x={cx}
                        y={TOP + PLOT_H + 18}
                        textAnchor="middle"
                        className={cn("text-[11px]", isActive ? "fill-ink font-semibold" : "fill-ink-muted")}
                      >
                        {monthName.format(p.month)}
                        {(i === 0 || p.month.getMonth() === 0) && (
                          <tspan x={cx} dy="1.25em" className="fill-ink-faint font-mono text-[10px]">
                            {p.month.getFullYear()}
                          </tspan>
                        )}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        )}

        {tip && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 rounded-2xl border border-line bg-white px-3.5 py-3 shadow-[0_14px_34px_-14px_rgb(22_22_26/0.35)]"
            style={{
              width: TIP_W,
              top: TOP,
              left: tipRight ? tipX + band / 2 + 6 : Math.max(0, tipX - band / 2 - 6 - TIP_W),
            }}
          >
            <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">
              {formatMonth(tip.month, locale, "long")}
            </p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2.5 text-[13px] leading-6">
                <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold text-ink tabular-nums">{formatMoney(tip[s.key], locale)}</span>
                <span className="text-ink-muted">{s.key === "revenue" ? dict.revenue : dict.profit}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MonthTable({
  points,
  dict,
  locale,
  visible,
}: {
  points: MonthPoint[]
  dict: Dictionary["overview"]["chart"]
  locale: Locale
  visible: boolean
}) {
  return (
    <div className={visible ? "overflow-x-auto px-5 pt-4 pb-5 sm:px-6" : "sr-only"}>
      <table className="w-full text-sm">
        <caption className="sr-only">{dict.caption}</caption>
        <thead>
          <tr className="border-b border-line text-left font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase">
            <th scope="col" className="py-2.5 pr-3 font-medium">
              {dict.month}
            </th>
            <th scope="col" className="py-2.5 pr-3 text-right font-medium">
              {dict.revenue}
            </th>
            <th scope="col" className="py-2.5 pr-3 text-right font-medium">
              {dict.profit}
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              {dict.pieces}
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {points.map((p) => (
            <tr key={p.month.getTime()} className="border-b border-line last:border-0">
              <th scope="row" className="py-2.5 pr-3 text-left font-medium whitespace-nowrap">
                {formatMonth(p.month, locale, "long")}
              </th>
              <td className="py-2.5 pr-3 text-right whitespace-nowrap">{formatMoney(p.revenue, locale)}</td>
              <td className={cn("py-2.5 pr-3 text-right whitespace-nowrap", p.profit < 0 && "text-loss")}>
                {formatMoney(p.profit, locale)}
              </td>
              <td className="py-2.5 text-right">{formatNumber(p.pieces, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


/** 1, 2, 2.5 or 5 × a power of ten: tick steps that read as round numbers. */
function niceStep(raw: number) {
  if (!(raw > 0)) return 1000
  const exp = 10 ** Math.floor(Math.log10(raw))
  const f = raw / exp
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp
}

/** A column from the baseline to `top`, rounded only at its data end (above or below zero). */
function columnPath(x: number, w: number, base: number, top: number) {
  const h = Math.abs(base - top)
  const r = Math.min(RADIUS, w / 2, h)
  if (top <= base) {
    return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${base}Z`
  }
  return `M${x},${base}V${top - r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top - r}V${base}Z`
}
