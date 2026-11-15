import type { Metadata } from "next"
import { OverviewPanel } from "@/components/overview/overview-panel"
import { getDictionary } from "@/content/dictionaries"

export async function generateMetadata(): Promise<Metadata> {
  const { overview, common } = await getDictionary()
  return { title: { absolute: `${overview.title} · ${common.meta.title}` } }
}

/** Static shell; `OverviewPanel` reads the data in the browser. */
export default async function Page() {
  const dict = await getDictionary()
  return <OverviewPanel dict={dict.overview} />
}
