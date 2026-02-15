import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { updateClubSchema } from "@/lib/validations/club"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        _count: { select: { tournaments: true } },
        tournaments: {
          where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
          take: 5,
          orderBy: { startDate: "asc" },
        },
      },
    })

    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: club.id,
        name: club.name,
        city: club.city,
        country: club.country,
        address: club.address,
        phone: club.phone,
        courts: club.courts,
        rating: club.rating,
        logoUrl: club.logoUrl,
        status: club.status,
        totalTournaments: club._count.tournaments,
        activeTournaments: club.tournaments,
      },
    })
  } catch (error) {
    console.error("Error fetching club:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener club" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const club = await prisma.club.findUnique({ where: { id } })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    // Only club owner or admin can update
    if (club.userId !== session!.user.id && session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
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

    const updated = await prisma.club.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating club:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar club" },
      { status: 500 }
    )
  }
}
