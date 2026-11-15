import type { Plural } from "@/lib/format"

/** Copy for the "overview" section. */
export const overview = {
  title: "Pregled",
  subtitle: "Kako posao stoji: zalihe, prodaja i profit.",

  period: {
    label: "Period",
    "7d": "7 dana",
    "30d": "30 dana",
    "3m": "3 meseca",
    "12m": "12 meseci",
    all: "Sve",
  },
  /** Under each KPI: what the change is measured against. */
  vsPrevious: {
    "7d": "u odnosu na prethodnih 7 dana",
    "30d": "u odnosu na prethodnih 30 dana",
    "3m": "u odnosu na prethodna 3 meseca",
    "12m": "u odnosu na prethodnih 12 meseci",
  },
  /** Mono labels above the two tile rows. */
  groups: {
    period: {
      "7d": "Poslednjih 7 dana",
      "30d": "Poslednjih 30 dana",
      "3m": "Poslednja 3 meseca",
      "12m": "Poslednjih 12 meseci",
      all: "Od početka",
    },
    now: "Trenutno stanje",
  },

  delta: {
    up: "rast",
    down: "pad",
    none: "nema podataka za poređenje",
    same: "bez promene",
    /** Margin changes are shown in percentage points. */
    points: "{n} p. p.",
  },

  kpi: {
    revenue: "Prihod",
    netProfit: "Neto profit",
    margin: "Marža",
    pieces: "Prodato komada",
    shippingCosts: "posle {amount} poštarine",
    noShippingCosts: "bez troškova poštarine",
    marginHint: "neto profit kao deo prihoda",
  },

  stock: {
    cost: "Roba na stanju",
    costHint: "po nabavnoj ceni · {pieces}",
    expectedProfit: "Očekivani profit",
    expectedProfitHint: "ako se sve proda za {value}",
    onTheWay: "Na putu",
    onTheWayHint: "pouzećem · {pending} za slanje, {sent} poslato",
    lowStock: "Pri kraju",
    lowStockHint: "{out} nema, {low} pri kraju",
    lowStockNone: "sve je na stanju",
    open: "Otvori",
  },

  chart: {
    title: "Prihod i profit po mesecima",
    description: "Neto profit: posle nabavne cene i poštarine. Istaknuti meseci su u izabranom periodu.",
    descriptionShort: "Neto profit: posle nabavne cene i poštarine.",
    revenue: "Prihod",
    profit: "Neto profit",
    view: "Prikaz",
    viewChart: "Grafikon",
    viewTable: "Tabela",
    month: "Mesec",
    pieces: "Komada",
    /** Accessible name of one month's bars: "nov 2026.: prihod …, neto profit …". */
    pointLabel: "{month}: prihod {revenue}, neto profit {profit}",
    caption: "Prihod i neto profit po mesecima",
    empty: "Grafikon će se pojaviti posle prve prodaje.",
  },

  categories: {
    title: "Profit po kategorijama",
    description: "Zarada na robi u izabranom periodu, pre poštarine.",
    uncategorized: "Bez kategorije",
    share: "{share} profita",
    empty: "Nema prodaje u ovom periodu.",
  },

  top: {
    title: "Najisplativiji artikli",
    description: "Pet artikala koji su doneli najviše profita u periodu.",
    rank: "Mesto",
    empty: "Nema prodaje u ovom periodu.",
  },

  pipeline: {
    title: "Pošiljke",
    description: "Spakovane u izabranom periodu i sve koje su još u toku.",
    total: "ukupno",
    cod: "pouzeće",
    link: "Sve pošiljke",
    barLabel: "Pošiljke po statusu",
    empty: "Nema pošiljki u ovom periodu.",
  },

  lowStock: {
    title: "Treba dopuniti",
    description: "Artikli kojih nema ili ih je ostalo malo.",
    left: "ostalo: {pieces}",
    link: "Otvori stanje",
    more: {
      one: "i još {n} artikal",
      few: "i još {n} artikla",
      other: "i još {n} artikala",
    } satisfies Plural as Plural,
    empty: "Sve je na stanju. Nijedan artikal nije pri kraju.",
  },

  activity: {
    title: "Poslednje aktivnosti",
    description: "Prodaje i promene statusa pošiljki.",
    sale: "Prodato: {name}",
    shipment: {
      pending: "Pošiljka {code} je spakovana",
      sent: "Pošiljka {code} je poslata",
      delivered: "Pošiljka {code} je legla",
      returned: "Pošiljka {code} je vraćena",
    },
    walkIn: "Kupac bez imena",
    empty: "Još nema aktivnosti.",
  },

  empty: {
    title: "Još nema podataka",
    description:
      "Dodaj prve artikle u Stanju i ovde će se pojaviti prodaja, profit i pošiljke. Demo podatke možeš da vratiš preko oznake Demo u zaglavlju.",
    action: "Idi na stanje",
  },
}
