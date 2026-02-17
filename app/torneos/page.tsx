import type { Metadata } from "next"
import TorneosClient from "./TorneosClient"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"

export const dynamic = "force-dynamic"

function humanizeSlug(slug: string) {
  const safe = (slug || "").trim()
  if (!safe) return ""
  return safe
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
): Promise<Metadata> {
  const sp = await searchParams
  const locale = (await getLocale()) as "es" | "en"

  const stateKey = typeof sp.stateKey === "string" ? sp.stateKey : ""
  const cityKey = typeof sp.cityKey === "string" ? sp.cityKey : ""

  const stateSlug = stateKey ? stateKey.split(":").pop() || "" : ""
  const citySlug = cityKey ? cityKey.split(":").pop() || "" : ""

  // Prefer the more specific page.
  if (citySlug) {
    const titleCity = humanizeSlug(citySlug)
    const title = titleCity ? `Torneos de Pádel en ${titleCity} | WhinPadel` : "Torneos de Pádel | WhinPadel"
    return {
      title,
      description: titleCity ? `Explora torneos de pádel en ${titleCity}. Filtra por fechas, modalidad y club.` : undefined,
      alternates: buildAlternates({
        pathname: "/torneos/ciudad/[slug]",
        params: { slug: citySlug },
        canonicalLocale: locale,
      }),
      robots: { index: false, follow: true },
    }
  }
  // De momento dejamos SEO solo por ciudad. Si llega stateKey, mantenemos /torneos como canonical.
  if (stateSlug) {
    return {
      title: "Torneos de Pádel | WhinPadel",
      description: "Explora torneos de pádel por ciudad, fecha, modalidad y club.",
      alternates: buildAlternates({ pathname: "/torneos", canonicalLocale: locale }),
      robots: { index: false, follow: true },
    }
  }

  return {
    title: "Torneos de Pádel | WhinPadel",
    description: "Explora torneos de pádel por ciudad, fecha, modalidad y club.",
    alternates: buildAlternates({ pathname: "/torneos", canonicalLocale: locale }),
  }
}

export default function TorneosPage() {
  return <TorneosClient />
}
