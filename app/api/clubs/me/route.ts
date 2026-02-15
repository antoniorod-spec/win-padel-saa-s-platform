import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { updateClubSchema } from "@/lib/validations/club"

export async function GET() {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    let club = null
    if (session!.user.role === "CLUB") {
      club = await prisma.club.findUnique({
        where: { userId: session!.user.id },
        include: {
          news: {
            orderBy: { createdAt: "desc" },
          },
        },
      })
    }

    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado para el usuario actual" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: club })
  } catch (error) {
    console.error("Error fetching current club:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener perfil del club" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
    })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado para actualizar" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = updateClubSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = { ...parsed.data } as Record<string, unknown>
    const normalizeEmpty = (value: unknown) =>
      typeof value === "string" && value.trim() === "" ? null : value

    const nullableTextFields = [
      "legalName",
      "email",
      "website",
      "contactEmail",
      "contactPosition",
      "postalCode",
      "neighborhood",
      "courtSurface",
      "operatingHours",
      "priceRange",
      "logoUrl",
      "facebook",
      "instagram",
      "tiktok",
      "youtube",
      "linkedin",
      "x",
      "whatsapp",
    ]
    for (const field of nullableTextFields) {
      if (field in data) data[field] = normalizeEmpty(data[field])
    }

    if (Array.isArray(data.photos)) {
      data.photos = data.photos.length > 0 ? data.photos : null
    }
    if (Array.isArray(data.services)) {
      data.services = data.services.length > 0 ? data.services : null
    }
    if (Array.isArray(data.courtSurfaces)) {
      data.courtSurfaces = data.courtSurfaces.length > 0 ? data.courtSurfaces : null
    }
    if (Array.isArray(data.weeklySchedule)) {
      data.weeklySchedule = data.weeklySchedule.length > 0 ? data.weeklySchedule : null
    }
    if (typeof data.indoorCourts === "number" || typeof data.outdoorCourts === "number") {
      const indoor =
        typeof data.indoorCourts === "number" ? data.indoorCourts : club.indoorCourts
      const outdoor =
        typeof data.outdoorCourts === "number" ? data.outdoorCourts : club.outdoorCourts
      data.courts = indoor + outdoor
    }

    const updated = await prisma.club.update({
      where: { id: club.id },
      data,
      include: {
        news: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating current club:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar perfil del club" },
      { status: 500 }
    )
  }
}
