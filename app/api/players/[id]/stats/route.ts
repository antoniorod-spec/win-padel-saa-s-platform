import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        rankings: true,
        registrationsAsPlayer1: {
          include: {
            tournamentModality: {
              include: { tournament: true },
            },
            matchesAsTeamA: true,
            matchesAsTeamB: true,
          },
        },
        registrationsAsPlayer2: {
          include: {
            tournamentModality: {
              include: { tournament: true },
            },
            matchesAsTeamA: true,
            matchesAsTeamB: true,
          },
        },
      },
    })

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Jugador no encontrado" },
        { status: 404 }
      )
    }

    // Aggregate stats from all registrations
    const allRegistrations = [
      ...player.registrationsAsPlayer1,
      ...player.registrationsAsPlayer2,
    ]

    const totalTournaments = allRegistrations.length
    const allMatches = allRegistrations.flatMap((r) => [
      ...r.matchesAsTeamA,
      ...r.matchesAsTeamB,
    ])

    return NextResponse.json({
      success: true,
      data: {
        rankings: player.rankings,
        totalTournaments,
        totalMatches: allMatches.length,
        recentRegistrations: allRegistrations.slice(0, 10).map((r) => ({
          tournamentName: r.tournamentModality.tournament.name,
          modality: r.tournamentModality.modality,
          category: r.tournamentModality.category,
          registeredAt: r.registeredAt,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching player stats:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener estadisticas" },
      { status: 500 }
    )
  }
}
