import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const [
      totalClubs,
      activePlayers,
      activeTournaments,
      pendingClubs,
      pendingCategoryReviews,
      totalRegistrations,
    ] = await Promise.all([
      prisma.club.count({ where: { status: "APPROVED" } }),
      prisma.player.count(),
      prisma.tournament.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.club.count({ where: { status: "PENDING" } }),
      prisma.categoryChange.count({ where: { status: "PENDING" } }),
      prisma.tournamentRegistration.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalClubs,
        activePlayers,
        activeTournaments,
        pendingClubs,
        pendingCategoryReviews,
        totalRegistrations,
      },
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener estadisticas" },
      { status: 500 }
    )
  }
}
