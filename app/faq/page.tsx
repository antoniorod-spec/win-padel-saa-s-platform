import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"
import FaqClient from "./FaqClient"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/faq", canonicalLocale: locale }),
  }
}

export default function FaqPage() {
  return <FaqClient />
}
