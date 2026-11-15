import type { Metadata } from "next"
import { SalesPanel } from "@/components/sales/sales-panel"
import { getDictionary } from "@/content/dictionaries"

export async function generateMetadata(): Promise<Metadata> {
  const { sales } = await getDictionary()
  return { title: sales.title }
}

/** Static shell; `SalesPanel` reads the data in the browser. */
export default async function Page() {
  const dict = await getDictionary()
  return <SalesPanel dict={dict.sales} />
}
