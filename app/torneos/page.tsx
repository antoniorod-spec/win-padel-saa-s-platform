import type { Metadata } from "next"
import TorneosClient from "./TorneosClient"

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
      alternates: { canonical: `/torneos/ciudad/${citySlug}` },
      robots: { index: false, follow: true },
    }
  }
  // De momento dejamos SEO solo por ciudad. Si llega stateKey, mantenemos /torneos como canonical.
  if (stateSlug) {
    return {
      title: "Torneos de Pádel | WhinPadel",
      description: "Explora torneos de pádel por ciudad, fecha, modalidad y club.",
      alternates: { canonical: "/torneos" },
      robots: { index: false, follow: true },
    }
  }

  return {
    title: "Torneos de Pádel | WhinPadel",
    description: "Explora torneos de pádel por ciudad, fecha, modalidad y club.",
    alternates: { canonical: "/torneos" },
  }
}

export default function TorneosPage() {
  return <TorneosClient />
}
