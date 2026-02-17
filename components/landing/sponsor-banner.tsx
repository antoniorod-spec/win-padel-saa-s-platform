import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"

export async function SponsorBannerSection() {
  const t = await getTranslations("LandingSponsor")
  let settings: {
    homeSponsorBannerEnabled: boolean
    homeSponsorBannerImageUrl: string | null
    homeSponsorBannerLinkUrl: string | null
    homeSponsorBannerTitle: string | null
  } | null = null

  try {
    settings = await prisma.platformSetting.findUnique({
      where: { id: "global" },
      select: {
        homeSponsorBannerEnabled: true,
        homeSponsorBannerImageUrl: true,
        homeSponsorBannerLinkUrl: true,
        homeSponsorBannerTitle: true,
      },
    })
  } catch (error) {
    // Fail-open for home page: if settings table is missing or DB is unavailable,
    // keep the page rendering without sponsored banner.
    console.error("Sponsor banner unavailable:", error)
    return null
  }

  if (!settings?.homeSponsorBannerEnabled || !settings.homeSponsorBannerImageUrl) {
    return null
  }

  const image = (
    <img
      src={settings.homeSponsorBannerImageUrl}
      alt={settings.homeSponsorBannerTitle || t("defaultAlt")}
      className="h-auto w-full rounded-xl border border-border object-cover"
    />
  )

  return (
    <section className="border-y border-border bg-card/60 py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {settings.homeSponsorBannerTitle ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            {settings.homeSponsorBannerTitle}
          </p>
        ) : null}
        {settings.homeSponsorBannerLinkUrl ? (
          <a
            href={settings.homeSponsorBannerLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-opacity hover:opacity-95"
          >
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    </section>
  )
}
