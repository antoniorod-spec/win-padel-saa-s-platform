import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") ?? "1")
    const pageSize = parseInt(searchParams.get("pageSize") ?? "10")

    // Find all registrations for this player
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        OR: [{ player1Id: id }, { player2Id: id }],
      },
      select: { id: true },
    })

    const registrationIds = registrations.map((r) => r.id)

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where: {
          OR: [
            { teamARegistrationId: { in: registrationIds } },
            { teamBRegistrationId: { in: registrationIds } },
          ],
        },
        include: {
          tournamentModality: {
            include: { tournament: { select: { name: true, category: true } } },
          },
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
        orderBy: { playedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.match.count({
        where: {
          OR: [
            { teamARegistrationId: { in: registrationIds } },
            { teamBRegistrationId: { in: registrationIds } },
          ],
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: matches.map((m) => {
          const teamAName = m.teamARegistration
            ? `${m.teamARegistration.player1.firstName} ${m.teamARegistration.player1.lastName} / ${m.teamARegistration.player2.firstName} ${m.teamARegistration.player2.lastName}`
            : "TBD"
          const teamBName = m.teamBRegistration
            ? `${m.teamBRegistration.player1.firstName} ${m.teamBRegistration.player1.lastName} / ${m.teamBRegistration.player2.firstName} ${m.teamBRegistration.player2.lastName}`
            : "TBD"

          const isTeamA = registrationIds.includes(m.teamARegistrationId ?? "")
          const won =
            (isTeamA && m.winner === "TEAM_A") ||
            (!isTeamA && m.winner === "TEAM_B")

          return {
            id: m.id,
            tournament: m.tournamentModality.tournament.name,
            tournamentCategory: m.tournamentModality.tournament.category,
            round: m.roundName,
            opponent: isTeamA ? teamBName : teamAName,
            scores: m.scores,
            result: m.winner === "NONE" ? "pending" : won ? "W" : "L",
            playedAt: m.playedAt,
          }
        }),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching player matches:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener partidos" },
      { status: 500 }
    )
  }
}
