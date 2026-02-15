import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modality = searchParams.get("modality") ?? "VARONIL"
    const category = searchParams.get("category") ?? "4ta"
    const city = searchParams.get("city")
    const scope = (searchParams.get("scope") ?? "NATIONAL").toUpperCase()
    const associationId = searchParams.get("associationId")

    const where: Record<string, unknown> = {
      modality,
      category,
      scope,
    }

    if (scope === "CITY") {
      where.associationId = associationId ?? undefined
    } else {
      where.associationId = null
    }

    if (city) {
      where.player = { city }
    }

    const rankings = await prisma.ranking.findMany({
      where,
      include: {
        association: {
          select: { id: true, name: true, city: true },
        },
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            registrationsAsPlayer1: {
              take: 1,
              include: {
                tournamentModality: {
                  include: {
                    tournament: {
                      include: { club: { select: { name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { points: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: rankings.map((r, idx) => ({
        id: r.id,
        playerId: r.player.id,
        playerName: `${r.player.firstName} ${r.player.lastName}`,
        city: r.player.city,
        associationId: r.association?.id ?? null,
        associationName: r.association?.name ?? null,
        club: r.player.registrationsAsPlayer1[0]?.tournamentModality?.tournament?.club?.name ?? "Sin club",
        points: r.points,
        played: r.played,
        wins: r.wins,
        losses: r.losses,
        winRate: r.played > 0 ? Math.round((r.wins / r.played) * 100) : 0,
        trend: "same" as const, // TODO: calculate from recent matches
        ascensionStreak: false, // TODO: calculate from category changes
        position: idx + 1,
      })),
    })
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener rankings" },
      { status: 500 }
    )
  }
}
