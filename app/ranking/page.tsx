import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"
import RankingClient from "./RankingClient"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/ranking", canonicalLocale: locale }),
  }
}

export default function RankingPage() {
  return <RankingClient />
}
