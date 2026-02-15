import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { updatePlayerSchema } from "@/lib/validations/player"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, image: true, role: true } },
        homeClub: { select: { id: true, name: true, city: true } },
        rankings: { orderBy: { points: "desc" } },
        categoryChanges: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    })

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Jugador no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        fullName: `${player.firstName} ${player.lastName}`,
        city: player.city,
        country: player.country,
        sex: player.sex,
        age: player.age,
        avatarUrl: player.user.image,
        homeClubId: player.homeClubId,
        homeClub: player.homeClub,
        rankings: player.rankings,
        categoryHistory: player.categoryChanges,
      },
    })
  } catch (error) {
    console.error("Error fetching player:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener jugador" },
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
    const { session, error } = await requireAuth()
    if (error) return error

    // Only the player themselves or an admin can update
    const player = await prisma.player.findUnique({ where: { id } })
    if (!player) {
      return NextResponse.json(
        { success: false, error: "Jugador no encontrado" },
        { status: 404 }
      )
    }

    if (player.userId !== session!.user.id && session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updatePlayerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.player.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating player:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar jugador" },
      { status: 500 }
    )
  }
}
