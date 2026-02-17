import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"
import ClubesClient from "./ClubesClient"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  const t = await getTranslations({ locale, namespace: "ClubesPage" })
  return {
    title: `${t("heading")} | WhinPadel`,
    description: t("subheading"),
    alternates: buildAlternates({ pathname: "/clubes", canonicalLocale: locale }),
  }
}

export default function ClubesPage() {
  return <ClubesClient />
}
