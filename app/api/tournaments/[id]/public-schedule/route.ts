import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const modalityId = searchParams.get("modalityId")

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true },
    })
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    }
    if (tournament.status === "DRAFT") {
      return NextResponse.json({ success: false, error: "Torneo no publicado" }, { status: 400 })
    }

    const where: any = {
      tournamentModality: { tournamentId: id },
      slotId: { not: null },
      phase: "GROUP_STAGE",
    }
    if (modalityId) where.tournamentModalityId = modalityId

    const matches = await prisma.match.findMany({
      where,
      include: {
        slot: { include: { court: true } },
        tournamentModality: { select: { id: true, modality: true, category: true } },
        teamARegistration: {
          include: {
            player1: { select: { firstName: true, lastName: true } },
            player2: { select: { firstName: true, lastName: true } },
          },
        },
        teamBRegistration: {
          include: {
            player1: { select: { firstName: true, lastName: true } },
            player2: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ slot: { date: "asc" } }, { slot: { startTime: "asc" } }],
      take: 5000,
    })

    return NextResponse.json({ success: true, data: matches })
  } catch (err) {
    console.error("Error fetching public schedule:", err)
    return NextResponse.json({ success: false, error: "Error al obtener rol de juegos" }, { status: 500 })
  }
}

