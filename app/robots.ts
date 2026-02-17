import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  // With `localePrefix: 'as-needed'`, default locale (es) has no prefix.
  const disallow = [
    "/api/",

    // Auth
    "/login",
    "/registro",
    "/onboarding",
    "/onboarding/",
    "/en/sign-in",
    "/en/sign-up",
    "/en/onboarding",
    "/en/onboarding/",

    // Private dashboards / admin
    "/admin",
    "/jugador",
    "/club",
    "/en/admin",
    "/en/player",
    "/en/club",
  ]

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

