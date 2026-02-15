import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await prisma.platformSetting.findUnique({
      where: { id: "global" },
      select: {
        homeSponsorBannerEnabled: true,
        homeSponsorBannerImageUrl: true,
        homeSponsorBannerLinkUrl: true,
        homeSponsorBannerTitle: true,
      },
    })

    const showBanner = Boolean(
      settings?.homeSponsorBannerEnabled && settings.homeSponsorBannerImageUrl
    )

    return NextResponse.json({
      success: true,
      data: {
        showBanner,
        imageUrl: settings?.homeSponsorBannerImageUrl ?? null,
        linkUrl: settings?.homeSponsorBannerLinkUrl ?? null,
        title: settings?.homeSponsorBannerTitle ?? null,
      },
    })
  } catch (error) {
    console.error("Error fetching public banner settings:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener banner publico" },
      { status: 500 }
    )
  }
}
