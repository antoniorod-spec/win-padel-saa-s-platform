import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { updateTournamentSchema } from "@/lib/validations/tournament"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true, city: true, courts: true } },
        modalities: {
          include: {
            _count: { select: { registrations: true } },
            registrations: {
              include: {
                player1: { select: { id: true, firstName: true, lastName: true } },
                player2: { select: { id: true, firstName: true, lastName: true } },
              },
              orderBy: { seed: "asc" },
            },
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneo no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        clubId: tournament.club.id,
        clubName: tournament.club.name,
        city: tournament.club.city,
        courts: tournament.club.courts,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        category: tournament.category,
        format: tournament.format,
        prize: tournament.prize,
        inscriptionPrice: Number(tournament.inscriptionPrice),
        maxTeams: tournament.maxTeams,
        rules: tournament.rules,
        status: tournament.status,
        modalities: tournament.modalities.map((m) => ({
          id: m.id,
          modality: m.modality,
          category: m.category,
          registeredTeams: m._count.registrations,
          teams: m.registrations.map((r) => ({
            registrationId: r.id,
            seed: r.seed,
            player1: `${r.player1.firstName} ${r.player1.lastName}`,
            player2: `${r.player2.firstName} ${r.player2.lastName}`,
            paymentStatus: r.paymentStatus,
          })),
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener torneo" },
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

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { club: true },
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneo no encontrado" },
        { status: 404 }
      )
    }

    if (tournament.club.userId !== session!.user.id && session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateTournamentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { modalities: _modalities, ...data } = parsed.data

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar torneo" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { club: true },
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneo no encontrado" },
        { status: 404 }
      )
    }

    if (tournament.club.userId !== session!.user.id && session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    if (tournament.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Solo se pueden eliminar torneos en estado borrador" },
        { status: 400 }
      )
    }

    await prisma.tournament.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Torneo eliminado" })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json(
      { success: false, error: "Error al eliminar torneo" },
      { status: 500 }
    )
  }
}
