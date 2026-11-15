import type { Metadata } from "next"
import { ShipmentsPanel } from "@/components/shipments/shipments-panel"
import { getDictionary } from "@/content/dictionaries"

export async function generateMetadata(): Promise<Metadata> {
  const { shipments } = await getDictionary()
  return { title: shipments.title }
}

/** Static shell; `ShipmentsPanel` reads the data in the browser. */
export default async function Page() {
  const dict = await getDictionary()
  return <ShipmentsPanel dict={dict.shipments} />
}
