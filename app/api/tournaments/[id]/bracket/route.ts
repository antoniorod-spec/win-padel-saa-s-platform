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

    const where: Record<string, unknown> = {
      tournamentModality: { tournamentId: id },
    }
    if (modalityId) {
      where.tournamentModalityId = modalityId
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
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
      orderBy: [{ roundOrder: "asc" }, { matchOrder: "asc" }],
    })

    // Group matches by round
    const roundsMap = new Map<string, typeof matches>()
    for (const match of matches) {
      const key = match.roundName
      if (!roundsMap.has(key)) roundsMap.set(key, [])
      roundsMap.get(key)!.push(match)
    }

    const rounds = Array.from(roundsMap.entries())
      .sort((a, b) => {
        const orderA = a[1][0]?.roundOrder ?? 0
        const orderB = b[1][0]?.roundOrder ?? 0
        return orderA - orderB
      })
      .map(([name, roundMatches]) => ({
        name,
        order: roundMatches[0]?.roundOrder ?? 0,
        matches: roundMatches.map((m) => {
          const teamAName = m.teamARegistration
            ? `${m.teamARegistration.player1.firstName} ${m.teamARegistration.player1.lastName} / ${m.teamARegistration.player2.firstName} ${m.teamARegistration.player2.lastName}`
            : "TBD"
          const teamBName = m.teamBRegistration
            ? `${m.teamBRegistration.player1.firstName} ${m.teamBRegistration.player1.lastName} / ${m.teamBRegistration.player2.firstName} ${m.teamBRegistration.player2.lastName}`
            : "TBD"

          const scores = (m.scores as { setA: number; setB: number }[]) ?? []

          return {
            id: m.id,
            teamA: {
              name: teamAName,
              seed: m.teamARegistration?.seed ?? null,
              score: scores.map((s) => s.setA),
              registrationId: m.teamARegistrationId,
            },
            teamB: {
              name: teamBName,
              seed: m.teamBRegistration?.seed ?? null,
              score: scores.map((s) => s.setB),
              registrationId: m.teamBRegistrationId,
            },
            winner: m.winner === "TEAM_A" ? "A" : m.winner === "TEAM_B" ? "B" : null,
          }
        }),
      }))

    return NextResponse.json({ success: true, data: { rounds } })
  } catch (error) {
    console.error("Error fetching bracket:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener bracket" },
      { status: 500 }
    )
  }
}
