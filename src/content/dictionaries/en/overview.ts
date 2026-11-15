import type { Dictionary } from "@/content/types"

export const overview: Dictionary["overview"] = {
  title: "Overview",
  subtitle: "How the business is doing: stock, sales and profit.",

  period: {
    label: "Period",
    "7d": "7 days",
    "30d": "30 days",
    "3m": "3 months",
    "12m": "12 months",
    all: "All",
  },
  periodShort: {
    "7d": "7 days",
    "30d": "30 days",
    "3m": "3 mo.",
    "12m": "12 mo.",
    all: "All",
  },
  vsPrevious: {
    "7d": "vs. the previous 7 days",
    "30d": "vs. the previous 30 days",
    "3m": "vs. the previous 3 months",
    "12m": "vs. the previous 12 months",
  },
  groups: {
    period: {
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "3m": "Last 3 months",
      "12m": "Last 12 months",
      all: "All time",
    },
    now: "Right now",
  },

  delta: {
    up: "up",
    down: "down",
    none: "no earlier data to compare",
    same: "no change",
    points: "{n} pts",
  },

  kpi: {
    revenue: "Revenue",
    netProfit: "Net profit",
    margin: "Margin",
    pieces: "Pieces sold",
    shippingCosts: "after {amount} postage",
    noShippingCosts: "no postage costs",
    marginHint: "net profit as a share of revenue",
  },

  stock: {
    cost: "Stock on hand",
    costHint: "at cost · {pieces}",
    expectedProfit: "Expected profit",
    expectedProfitHint: "if everything sells for {value}",
    shipments: "Open shipments",
    shipmentsHint: "cash on delivery · {pending} to send, {sent} sent",
    lowStock: "Running low",
    lowStockHint: "{out} out, {low} low",
    lowStockNone: "everything is in stock",
    open: "Open",
  },

  chart: {
    title: "Revenue and profit by month",
    description: "Net profit: after cost of goods and postage. Months in the selected period are marked by a band.",
    descriptionShort: "Net profit: after cost of goods and postage.",
    revenue: "Revenue",
    profit: "Net profit",
    thisMonth: "This month · {month}",
    view: "View",
    viewChart: "Chart",
    viewTable: "Table",
    month: "Month",
    pieces: "Pieces",
    pointLabel: "{month}: revenue {revenue}, net profit {profit}",
    caption: "Revenue and net profit by month",
    empty: "The chart appears after the first sale.",
  },

  categories: {
    title: "Profit by category",
    description: "Profit on goods in the selected period, before postage.",
    uncategorized: "Uncategorised",
    share: "{share} of profit",
    empty: "No sales in this period.",
  },

  top: {
    title: "Most profitable items",
    description: "The five items that earned the most in the period.",
    rank: "Rank",
    empty: "No sales in this period.",
  },

  pipeline: {
    title: "Shipments",
    description: "Packed in the selected period, plus every one still under way.",
    total: "total",
    cod: "cash on delivery",
    link: "All shipments",
    barLabel: "Shipments by status",
    empty: "No shipments in this period.",
  },

  lowStock: {
    title: "Needs restocking",
    description: "Items that are out of stock or nearly gone.",
    left: "{pieces} left",
    link: "Open stock",
    more: { one: "and {n} more item", other: "and {n} more items" },
    empty: "Everything is in stock. Nothing is running low.",
  },

  activity: {
    title: "Recent activity",
    description: "Sales and shipment status changes.",
    sale: "Sold: {name}",
    shipment: {
      pending: "Shipment {code} packed",
      sent: "Shipment {code} sent",
      delivered: "Shipment {code} delivered",
      returned: "Shipment {code} returned",
    },
    walkIn: "Walk-in customer",
    empty: "No activity yet.",
  },

  empty: {
    title: "No data yet",
    description:
      "Add your first items under Stock and sales, profit and shipments will show up here. You can restore the demo data with the Demo button.",
    action: "Go to stock",
  },
}
