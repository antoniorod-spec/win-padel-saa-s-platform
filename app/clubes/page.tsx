import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"
import ClubesClient from "./ClubesClient"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/clubes", canonicalLocale: locale }),
  }
}

export default function ClubesPage() {
  return <ClubesClient />
}
