"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { useApp } from "@/components/app/app-provider"
import { ChipGroup } from "@/components/app/chip-group"
import { Panel, PanelHeader } from "@/components/app/panel"
import { siteConfig, type Locale } from "@/config/site"
import type { Dictionary } from "@/content/types"
import { fill, formatMoney, formatMoneyCompact, formatMonth, formatNumber } from "@/lib/format"
import type { DateRange, MonthPoint } from "@/lib/inventory/stats"
import { cn } from "@/lib/utils"
import { PanelEmpty } from "./figures"
import { profitText } from "@/components/app/money"

/**
 * Revenue per month as quiet slate columns (the same colour in every month)
 * and net profit as a green line with points, on one money axis. The
 * selected period is a soft lime band behind its months, never a recolouring.
 * Hand-drawn SVG sized to its container in pixels (so text never scales),
 * a tooltip per month on hover and keyboard focus, and the same numbers as a
 * table (visible on request, otherwise for screen readers only).
 */

const PLOT_H = 256
const TOP = 14
const AXIS_H = 36
const MAX_BAR = 26
const RADIUS = 3
const TIP_W = 176

type SeriesKey = "revenue" | "profit"
const seriesKeys: readonly SeriesKey[] = ["revenue", "profit"]

type View = "chart" | "table"

/** Whether a month overlaps the selected period. */
function inPeriod(p: MonthPoint, range: DateRange) {
  const end = new Date(p.month.getFullYear(), p.month.getMonth() + 1, 1).getTime()
  return (range.start === null || end > range.start) && p.month.getTime() < range.end
}

/** The months the period band covers, or null when every (or no) month is in the period. */
function periodBand(points: MonthPoint[], range: DateRange) {
  const idx = points.flatMap((p, i) => (inPeriod(p, range) ? [i] : []))
  if (idx.length === 0 || idx.length === points.length) return null
  return { from: idx[0], to: idx[idx.length - 1] }
}

/** Legend and tooltip key, drawn exactly like the mark it stands for. */
function Swatch({ series }: { series: SeriesKey }) {
  if (series === "revenue") return <span className="size-2.5 shrink-0 rounded-[2px] bg-chart-1" aria-hidden />
  return (
    <svg width={16} height={10} viewBox="0 0 16 10" className="shrink-0 overflow-visible" aria-hidden>
      <line x1={0} x2={16} y1={5} y2={5} stroke="var(--chart-2)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={8} cy={5} r={2.75} fill="var(--surface)" stroke="var(--chart-2)" strokeWidth={1.75} />
    </svg>
  )
}

export function MonthlyChart({
  dict,
  points,
  range,
}: {
  dict: Dictionary["overview"]["chart"]
  points: MonthPoint[]
  /** The selected period: its months get a soft band behind them. */
  range: DateRange
}) {
  const { locale } = useApp()
  const [view, setView] = useState<View>("chart")
  const [active, setActive] = useState<number | null>(null)
  const last = points.length - 1
  const shown = active ?? last
  const band = periodBand(points, range)

  return (
    <Panel className="flex h-full min-w-0 flex-col">
      <PanelHeader
        title={dict.title}
        description={band ? dict.description : dict.descriptionShort}
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
              {/* Legend that doubles as the direct label: the hovered (or latest) month's values,
                  under the month they belong to, so they never read as the period's totals. */}
              <div className="flex flex-col gap-2.5 px-4 pt-4 sm:px-5" aria-hidden>
                <p className="text-[12.5px] font-medium text-fg-muted">
                  {active === null
                    ? fill(dict.thisMonth, { month: formatMonth(points[shown].month, locale, "long") })
                    : formatMonth(points[shown].month, locale, "long")}
                </p>
                <div className="flex flex-wrap items-end gap-x-7 gap-y-2">
                  {seriesKeys.map((key) => {
                    const v = points[shown][key]
                    return (
                      <div key={key} className="flex min-w-0 flex-col gap-1.5">
                        <span className="flex items-center gap-2 text-[12.5px] font-medium text-fg-muted">
                          <Swatch series={key} />
                          {key === "revenue" ? dict.revenue : dict.profit}
                        </span>
                        <span
                          className={cn(
                            "text-[22px] leading-7 font-semibold tracking-[-0.03em] tabular-nums",
                            key === "profit" && profitText(v, ""),
                          )}
                        >
                          {formatMoney(v, locale)}
                        </span>
                      </div>
                    )
                  })}
                </div>
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
  // Roving tab stop: one month is in the Tab order (the last one focused, else the latest); arrows move between them.
  const [stop, setStop] = useState<number | null>(null)
  const tabStop = stop !== null && stop < points.length ? stop : points.length - 1
  // useId can contain characters that break `url(#…)`; keep it to a plain id.
  const gradientId = `overview-profit-${useId().replace(/[^\w-]/g, "")}`

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Y scale: one money axis for both series, zero included, negative profit allowed.
  const hi = Math.max(0, ...points.map((p) => Math.max(p.revenue, p.profit)))
  const lo = Math.min(0, ...points.map((p) => Math.min(p.revenue, p.profit)))
  const step = niceStep((hi - lo) / 4)
  const yMin = Math.floor(lo / step) * step
  const yMax = Math.max(step, Math.ceil(hi / step) * step)
  const ticks: number[] = []
  for (let v = yMin; v <= yMax + step / 2; v += step) ticks.push(v)
  const tickLabels = ticks.map((v) => formatMoneyCompact(v, locale))

  const left = Math.max(...tickLabels.map((l) => l.length)) * 6.6 + 14
  const plotW = Math.max(0, width - left - 4)
  const band = points.length > 0 ? plotW / points.length : 0
  const barW = Math.max(4, Math.min(MAX_BAR, band * 0.46))
  const y = (v: number) => TOP + ((yMax - v) / (yMax - yMin)) * PLOT_H
  const zero = y(0)
  const labelEvery = band < 30 ? 2 : 1
  const monthName = new Intl.DateTimeFormat(siteConfig.localeTags[locale], { month: "short" })
  const period = periodBand(points, range)

  // Profit as a line through the middle of each month, with a faint area down to zero.
  const linePts = points.map((p, i) => [left + band * (i + 0.5), y(p.profit)] as const)
  const linePath = linePts.map(([x, py], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`).join("")
  const areaPath =
    linePts.length > 1
      ? `${linePath}L${linePts[linePts.length - 1][0].toFixed(1)},${zero.toFixed(1)}L${linePts[0][0].toFixed(1)},${zero.toFixed(1)}Z`
      : ""

  function onKeyDown(e: KeyboardEvent<SVGGElement>) {
    const el = e.currentTarget
    const next =
      e.key === "ArrowRight"
        ? el.nextElementSibling
        : e.key === "ArrowLeft"
          ? el.previousElementSibling
          : e.key === "Home"
            ? el.parentElement?.firstElementChild
            : e.key === "End"
              ? el.parentElement?.lastElementChild
              : null
    if (next instanceof SVGGElement) {
      e.preventDefault()
      next.focus()
    }
  }

  // The tooltip sits at the top of the plot beside the month, so it never covers that month's marks.
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
          @keyframes overview-draw { from { stroke-dashoffset: 1 } }
          .overview-line { stroke-dasharray: 1; animation: overview-draw 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) 0.25s both; }
          @keyframes overview-fade { from { opacity: 0 } }
          .overview-fade { animation: overview-fade 0.6s ease 0.5s both; }
          @media (prefers-reduced-motion: reduce) { .overview-bar, .overview-line, .overview-fade { animation: none; } }
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
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--chart-2)" stopOpacity="0.12" />
                <stop offset="1" stopColor="var(--chart-2)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* The selected period: a soft lime band with a dashed edge behind its months. */}
            {period && (
              <rect
                x={left + band * period.from + 1}
                y={TOP - 6}
                width={Math.max(0, band * (period.to - period.from + 1) - 2)}
                height={PLOT_H + 12}
                rx={8}
                fill="var(--chart-band)"
                fillOpacity={0.75}
                stroke="var(--accent-edge)"
                strokeOpacity={0.55}
                strokeDasharray="3 4"
              />
            )}

            {ticks.map((v, i) => (
              <g key={v}>
                <line
                  x1={left}
                  x2={width}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={v === 0 ? "var(--hairline-strong)" : "var(--chart-grid)"}
                  strokeDasharray={v === 0 ? undefined : "3 3"}
                  shapeRendering="crispEdges"
                />
                <text
                  x={left - 10}
                  y={y(v)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-fg-faint text-[11px] tabular-nums"
                >
                  {tickLabels[i]}
                </text>
              </g>
            ))}

            <g>
              {points.map((p, i) => {
                const x0 = left + band * i
                const cx = x0 + band / 2
                const isActive = active === i
                return (
                  <g
                    key={p.month.getTime()}
                    tabIndex={i === tabStop ? 0 : -1}
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
                      setStop(i)
                      if (e.currentTarget.matches(":focus-visible")) setFocused(i)
                    }}
                    onBlur={() => {
                      onActive(null)
                      setFocused(null)
                    }}
                    onKeyDown={onKeyDown}
                  >
                    {/* The whole column is the hit target, not just the painted bar. */}
                    <rect
                      x={x0 + 1}
                      y={TOP - 6}
                      width={Math.max(0, band - 2)}
                      height={PLOT_H + 12}
                      rx={8}
                      fill="var(--fg)"
                      fillOpacity={isActive ? 0.045 : 0}
                      stroke={focused === i ? "var(--ring)" : "none"}
                      strokeWidth={2}
                      className="transition-[fill-opacity] duration-150"
                    />
                    {p.revenue !== 0 && (
                      <path
                        d={columnPath(cx - barW / 2, barW, zero, y(p.revenue))}
                        fill="var(--chart-1)"
                        data-negative={p.revenue < 0 || undefined}
                        className="overview-bar"
                        style={{ animationDelay: `${i * 35}ms` }}
                      />
                    )}
                    {i % labelEvery === (points.length - 1) % labelEvery && (
                      <text
                        x={cx}
                        y={TOP + PLOT_H + 18}
                        textAnchor="middle"
                        className={cn("text-[11px]", isActive ? "fill-fg font-semibold" : "fill-fg-faint")}
                      >
                        {monthName.format(p.month)}
                        {(i === 0 || p.month.getMonth() === 0) && (
                          <tspan x={cx} dy="1.25em" className="fill-fg-faint text-[10px] tabular-nums">
                            {p.month.getFullYear()}
                          </tspan>
                        )}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>

            {/* Profit line: drawn over the columns, never catches the pointer. */}
            <g className="pointer-events-none">
              {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} className="overview-fade" />}
              {linePts.length > 1 && (
                <path
                  d={linePath}
                  pathLength={1}
                  fill="none"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="overview-line"
                />
              )}
              {points.map((p, i) => {
                const isActive = active === i
                const color = p.profit < 0 ? "var(--loss)" : "var(--chart-2)"
                return (
                  <circle
                    key={p.month.getTime()}
                    cx={linePts[i][0]}
                    cy={linePts[i][1]}
                    r={isActive ? 4.5 : 3}
                    fill={isActive ? color : "var(--surface)"}
                    stroke={color}
                    strokeWidth={2}
                    className="overview-fade transition-[r] duration-150"
                  />
                )
              })}
            </g>
          </svg>
        )}

        {tip && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 rounded-lg border border-hairline bg-surface px-3 py-2.5 shadow-pop"
            style={{
              width: TIP_W,
              top: TOP,
              left: tipRight ? tipX + band / 2 + 6 : Math.max(0, tipX - band / 2 - 6 - TIP_W),
            }}
          >
            <p className="mb-1.5 text-[12px] font-medium text-fg-muted">
              {formatMonth(tip.month, locale, "long")}
            </p>
            {seriesKeys.map((key) => (
              <p key={key} className="flex items-center gap-2.5 text-[13px] leading-6">
                <Swatch series={key} />
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    key === "profit" ? profitText(tip.profit, "text-fg") : "text-fg",
                  )}
                >
                  {formatMoney(tip[key], locale)}
                </span>
                <span className="text-fg-muted">{key === "revenue" ? dict.revenue : dict.profit}</span>
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
    <div className={visible ? "overflow-x-auto px-4 pt-4 pb-5 sm:px-5" : "sr-only"}>
      <table className="w-full text-sm">
        <caption className="sr-only">{dict.caption}</caption>
        <thead>
          <tr className="border-b border-hairline text-left text-[12px] text-fg-muted">
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
            <tr key={p.month.getTime()} className="border-b border-hairline last:border-0">
              <th scope="row" className="py-2.5 pr-3 text-left font-medium whitespace-nowrap">
                {formatMonth(p.month, locale, "long")}
              </th>
              <td className="py-2.5 pr-3 text-right whitespace-nowrap">{formatMoney(p.revenue, locale)}</td>
              <td className={cn("py-2.5 pr-3 text-right whitespace-nowrap", profitText(p.profit, ""))}>
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
