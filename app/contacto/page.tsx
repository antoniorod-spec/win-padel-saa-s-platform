import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"
import ContactoClient from "./ContactoClient"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/contacto", canonicalLocale: locale }),
  }
}

export default function ContactoPage() {
  return <ContactoClient />
}
