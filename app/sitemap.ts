import type { MetadataRoute } from "next"
import { buildAlternates } from "@/lib/seo/alternates"
import { routing } from "@/i18n/routing"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

function abs(path: string) {
  return new URL(path, siteUrl).toString()
}

const PUBLIC_PATHNAMES = [
  "/",
  "/torneos",
  "/clubes",
  "/ranking",
  "/como-funciona",
  "/nosotros",
  "/faq",
  "/contacto",
  "/patrocinadores",
  "/terminos",
  "/privacidad",
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PUBLIC_PATHNAMES.map((pathname) => {
    const alternates = buildAlternates({
      // canonicalLocale is the entry we list in sitemap (Spanish by default).
      canonicalLocale: routing.defaultLocale,
      pathname,
    })

    return {
      url: abs(alternates.canonical),
      lastModified,
      alternates: {
        languages: {
          es: abs(alternates.languages.es),
          en: abs(alternates.languages.en),
        },
      },
    }
  })
}

