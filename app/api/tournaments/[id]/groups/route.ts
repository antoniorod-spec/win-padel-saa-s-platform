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

    // Get group-stage matches (roundOrder = 1 typically)
    const where: Record<string, unknown> = {
      tournamentModality: { tournamentId: id },
      roundOrder: 1, // Group stage
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
    })

    // Group by roundName (e.g., "Grupo A", "Grupo B")
    const groupsMap = new Map<string, typeof matches>()
    for (const match of matches) {
      const groupName = match.roundName
      if (!groupsMap.has(groupName)) groupsMap.set(groupName, [])
      groupsMap.get(groupName)!.push(match)
    }

    const groups = Array.from(groupsMap.entries()).map(([groupName, groupMatches]) => {
      // Calculate standings
      const standings = new Map<string, {
        teamName: string
        registrationId: string
        wins: number
        losses: number
        setsFor: number
        setsAgainst: number
        points: number
      }>()

      for (const match of groupMatches) {
        const teamAId = match.teamARegistrationId ?? ""
        const teamBId = match.teamBRegistrationId ?? ""
        const teamAName = match.teamARegistration
          ? `${match.teamARegistration.player1.firstName} ${match.teamARegistration.player1.lastName} / ${match.teamARegistration.player2.firstName} ${match.teamARegistration.player2.lastName}`
          : "TBD"
        const teamBName = match.teamBRegistration
          ? `${match.teamBRegistration.player1.firstName} ${match.teamBRegistration.player1.lastName} / ${match.teamBRegistration.player2.firstName} ${match.teamBRegistration.player2.lastName}`
          : "TBD"

        if (!standings.has(teamAId)) {
          standings.set(teamAId, { teamName: teamAName, registrationId: teamAId, wins: 0, losses: 0, setsFor: 0, setsAgainst: 0, points: 0 })
        }
        if (!standings.has(teamBId)) {
          standings.set(teamBId, { teamName: teamBName, registrationId: teamBId, wins: 0, losses: 0, setsFor: 0, setsAgainst: 0, points: 0 })
        }

        if (match.winner !== "NONE") {
          const scores = (match.scores as { setA: number; setB: number }[]) ?? []
          const setsA = scores.filter((s) => s.setA > s.setB).length
          const setsB = scores.filter((s) => s.setB > s.setA).length

          const a = standings.get(teamAId)!
          const b = standings.get(teamBId)!
          a.setsFor += setsA
          a.setsAgainst += setsB
          b.setsFor += setsB
          b.setsAgainst += setsA

          if (match.winner === "TEAM_A") {
            a.wins += 1
            a.points += 3
            b.losses += 1
          } else {
            b.wins += 1
            b.points += 3
            a.losses += 1
          }
        }
      }

      return {
        group: groupName,
        teams: Array.from(standings.values()).sort((a, b) => b.points - a.points || (b.setsFor - b.setsAgainst) - (a.setsFor - a.setsAgainst)),
      }
    })

    return NextResponse.json({ success: true, data: { groups } })
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener fase de grupos" },
      { status: 500 }
    )
  }
}
