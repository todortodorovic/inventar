import type { Metadata } from "next"
import { InventoryPanel } from "@/components/inventory/inventory-panel"
import { getDictionary } from "@/content/dictionaries"

export async function generateMetadata(): Promise<Metadata> {
  const { inventory } = await getDictionary()
  return { title: inventory.title }
}

/** Static shell; `InventoryPanel` reads the data in the browser. */
export default async function Page() {
  const dict = await getDictionary()
  return <InventoryPanel dict={dict.inventory} />
}
