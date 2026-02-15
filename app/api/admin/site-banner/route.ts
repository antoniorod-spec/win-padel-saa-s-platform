import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const settings = await prisma.platformSetting.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global" },
    })

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error fetching site banner settings:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener configuracion de banner" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["ADMIN"])
    if (error) return error

    const body = await request.json()
    const enabled = Boolean(body.homeSponsorBannerEnabled)
    const imageUrl = typeof body.homeSponsorBannerImageUrl === "string" ? body.homeSponsorBannerImageUrl.trim() : ""
    const linkUrl = typeof body.homeSponsorBannerLinkUrl === "string" ? body.homeSponsorBannerLinkUrl.trim() : ""
    const title = typeof body.homeSponsorBannerTitle === "string" ? body.homeSponsorBannerTitle.trim() : ""

    const settings = await prisma.platformSetting.upsert({
      where: { id: "global" },
      update: {
        homeSponsorBannerEnabled: enabled,
        homeSponsorBannerImageUrl: imageUrl || null,
        homeSponsorBannerLinkUrl: linkUrl || null,
        homeSponsorBannerTitle: title || null,
        updatedByUserId: session!.user.id,
      },
      create: {
        id: "global",
        homeSponsorBannerEnabled: enabled,
        homeSponsorBannerImageUrl: imageUrl || null,
        homeSponsorBannerLinkUrl: linkUrl || null,
        homeSponsorBannerTitle: title || null,
        updatedByUserId: session!.user.id,
      },
    })

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error updating site banner settings:", error)
    return NextResponse.json(
      { success: false, error: "Error al guardar configuracion de banner" },
      { status: 500 }
    )
  }
}
