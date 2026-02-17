import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; modId: string }> }
) {
  try {
    const { id, modId } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const modality = await prisma.tournamentModality.findUnique({
      where: { id: modId },
      include: { tournament: { include: { club: true } } },
    })
    if (!modality || modality.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Modalidad no encontrada" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && modality.tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const groups = await prisma.tournamentGroup.findMany({
      where: { tournamentModalityId: modId },
      include: {
        placements: {
          include: {
            registration: {
              include: {
                player1: { select: { id: true, firstName: true, lastName: true } },
                player2: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
          orderBy: [{ seed: "asc" }, { id: "asc" }],
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ success: true, data: groups })
  } catch (err) {
    console.error("Error fetching modality groups:", err)
    return NextResponse.json({ success: false, error: "Error al obtener grupos" }, { status: 500 })
  }
}

