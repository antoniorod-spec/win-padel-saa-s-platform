import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const club = await prisma.club.findUnique({ where: { id } })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const [
      totalTournaments,
      activeTournaments,
      totalRegistrations,
      pendingPayments,
    ] = await Promise.all([
      prisma.tournament.count({ where: { clubId: id } }),
      prisma.tournament.count({
        where: { clubId: id, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.tournamentRegistration.count({
        where: { tournamentModality: { tournament: { clubId: id } } },
      }),
      prisma.tournamentRegistration.count({
        where: {
          tournamentModality: { tournament: { clubId: id } },
          paymentStatus: "PENDING",
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalTournaments,
        activeTournaments,
        totalRegistrations,
        pendingPayments,
        courts: club.courts,
        rating: club.rating,
      },
    })
  } catch (error) {
    console.error("Error fetching club stats:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener estadisticas del club" },
      { status: 500 }
    )
  }
}
