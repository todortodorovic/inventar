import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/app/page-header"
import { buttonVariants } from "@/components/ui/button-variants"
import { localePath } from "@/config/site"
import { getDictionary, getLocale } from "@/content/dictionaries"

export async function generateMetadata(): Promise<Metadata> {
  const { common } = await getDictionary()
  return { title: common.notFound.title }
}

/** 404 inside the app shell: the same nav, `<html lang>` and language as every section. */
export default async function NotFound() {
  const locale = await getLocale()
  const { common } = await getDictionary(locale)
  return (
    <PageHeader
      title={common.notFound.title}
      subtitle={common.notFound.description}
      actions={
        <Link href={localePath(locale)} className={buttonVariants({ variant: "primary", size: "cta" })}>
          {common.notFound.back}
        </Link>
      }
    />
  )
}
