import { prisma } from "@/lib/prisma"
import { advanceWinner } from "@/lib/services/tournament-service"

function powerOf2BelowOrEqual(n: number): number {
  let p = 1
  while (p * 2 <= n) p *= 2
  return p
}

export async function advanceAutomationWinner(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournamentModality: {
        include: {
          tournament: true,
          groups: true,
        },
      },
    },
  })
  if (!match) return
  if (match.winner === "NONE") return

  // If this is a preliminary round created by generateMirrorBracket, we place the winner
  // into the appropriate open slot of the main bracket (roundOrder=2).
  if (match.phase === "PRELIMINARY_ROUND") {
    const winnerId =
      match.winner === "TEAM_A" ? match.teamARegistrationId : match.teamBRegistrationId
    if (!winnerId) return

    const modalityId = match.tournamentModalityId
    const groupsCount = match.tournamentModality.groups.length
    const totalQualified = groupsCount * 2
    const bracketSize = powerOf2BelowOrEqual(totalQualified)
    const prelimMatches = totalQualified - bracketSize
    const byesCount = bracketSize - prelimMatches
    const mainMatchCount = bracketSize / 2

    const mainMatches = await prisma.match.findMany({
      where: { tournamentModalityId: modalityId, roundOrder: 2 },
      orderBy: { matchOrder: "asc" },
      select: { id: true, matchOrder: true, teamARegistrationId: true, teamBRegistrationId: true },
    })
    if (mainMatches.length !== mainMatchCount) {
      // If something diverged, fallback to the generic advanceWinner logic.
      await advanceWinner(matchId)
      return
    }

    // Compute open slots deterministically (must match generateMirrorBracket).
    const openSlots: Array<{ matchId: string; side: "A" | "B" }> = []
    for (let i = 0; i < mainMatches.length; i += 1) {
      const m = mainMatches[i]
      const isByeMatch = m.matchOrder <= byesCount
      if (isByeMatch) {
        openSlots.push({ matchId: m.id, side: "B" })
      } else {
        openSlots.push({ matchId: m.id, side: "A" })
        openSlots.push({ matchId: m.id, side: "B" })
      }
    }

    const target = openSlots[match.matchOrder - 1]
    if (!target) return

    const field = target.side === "A" ? "teamARegistrationId" : "teamBRegistrationId"
    await prisma.match.update({
      where: { id: target.matchId },
      data: { [field]: winnerId },
    })

    // Prelim match does not advance via the 2-to-1 bracket rule.
    return
  }

  // For the rest of the bracket, use the existing generic progression.
  await advanceWinner(matchId)
}

