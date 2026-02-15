import { prisma } from "@/lib/prisma"
import { POINTS_TABLE } from "@/lib/types"
import type { TournamentCategory, Modality } from "@/lib/types"

type FinalStage =
  | "CHAMPION"
  | "RUNNER_UP"
  | "SEMIFINAL"
  | "QUARTERFINAL"
  | "ROUND_OF_16"
  | "ROUND_OF_32"
  | "GROUP_STAGE"

function rankingUniqueWhere(
  playerId: string,
  modality: Modality,
  category: string,
  scope: "CITY" | "NATIONAL"
) {
  return {
    playerId_modality_category_scope: {
      playerId,
      modality,
      category,
      scope,
    },
  } as const
}

/**
 * Get points for a round result based on tournament category
 */
export function getPointsForRound(
  tournamentCategory: TournamentCategory,
  roundOrder: number,
  isWinner: boolean,
  totalRounds: number
): number {
  const table = POINTS_TABLE[tournamentCategory] as ReadonlyArray<{ readonly round: string; readonly roundOrder: number; readonly points: number }> | undefined
  if (!table) return 0

  // Map roundOrder + isWinner to the correct points
  // Final winner = Campeon, Final loser = Subcampeon, etc.
  if (roundOrder === totalRounds && isWinner) {
    return table.find((r: { round: string }) => r.round.includes("Campeon"))?.points ?? 0
  }
  if (roundOrder === totalRounds && !isWinner) {
    return table.find((r: { round: string }) => r.round.includes("Subcampeon") || r.round.includes("Final"))?.points ?? 0
  }

  // Semifinal losers
  if (roundOrder === totalRounds - 1 && !isWinner) {
    return table.find((r: { round: string }) => r.round.includes("Semifinalista"))?.points ?? 0
  }

  // Quarter-final losers
  if (roundOrder === totalRounds - 2 && !isWinner) {
    return table.find((r: { round: string }) => r.round.includes("Cuartofinalista"))?.points ?? 0
  }

  // Round of 16 losers
  if (roundOrder === totalRounds - 3 && !isWinner) {
    return table.find((r: { round: string }) => r.round.includes("Octavos"))?.points ?? 0
  }

  // Group stage
  if (roundOrder === 1) {
    return table.find((r: { round: string }) => r.round.includes("Fase de grupos"))?.points ?? 0
  }

  return 0
}

/**
 * Process the result of a match and update rankings/detect ascension
 */
export async function processMatchResult(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournamentModality: {
        include: {
          tournament: true,
          matches: {
            orderBy: { roundOrder: "desc" },
            take: 1,
          },
        },
      },
      teamARegistration: {
        include: {
          player1: true,
          player2: true,
        },
      },
      teamBRegistration: {
        include: {
          player1: true,
          player2: true,
        },
      },
    },
  })

  if (!match || match.winner === "NONE") return

  const tournament = match.tournamentModality.tournament
  const modality = match.tournamentModality.modality
  const category = match.tournamentModality.category
  const totalRounds = match.tournamentModality.matches[0]?.roundOrder ?? match.roundOrder

  // Determine winners and losers
  const winnerReg = match.winner === "TEAM_A" ? match.teamARegistration : match.teamBRegistration
  const loserReg = match.winner === "TEAM_A" ? match.teamBRegistration : match.teamARegistration

  if (!winnerReg || !loserReg) return

  // Get the players from both teams
  const winnerPlayers = [winnerReg.player1, winnerReg.player2]
  const loserPlayers = [loserReg.player1, loserReg.player2]

  // Update rankings for winners
  for (const player of winnerPlayers) {
    await updatePlayerRanking(player.id, modality, category, true)
  }

  // Update rankings for losers
  for (const player of loserPlayers) {
    await updatePlayerRanking(player.id, modality, category, false)
  }

  // If this is the final match, assign tournament points
  if (match.roundOrder === totalRounds) {
    await assignTournamentPoints(
      match.tournamentModality.id,
      tournament.category,
      totalRounds
    )

    // Check for ascension conditions for the winner
    for (const player of winnerPlayers) {
      await checkAscensionConditions(player.id, modality, category)
    }
  }
}

/**
 * Update a player's ranking record
 */
async function updatePlayerRanking(
  playerId: string,
  modality: Modality,
  category: string,
  won: boolean,
  associationId: string | null = null
) {
  const targets: Array<{ scope: "CITY" | "NATIONAL"; associationId: string | null }> = [
    { scope: "CITY", associationId },
    { scope: "NATIONAL", associationId: null },
  ]
  for (const target of targets) {
    await prisma.ranking.upsert({
      where: rankingUniqueWhere(playerId, modality, category, target.scope),
      update: {
        played: { increment: 1 },
        wins: won ? { increment: 1 } : undefined,
        losses: won ? undefined : { increment: 1 },
      },
      create: {
        playerId,
        modality,
        category,
        scope: target.scope,
        associationId: target.associationId,
        played: 1,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        points: 0,
      },
    })
  }
}

/**
 * Assign tournament points to all participants based on their final round
 */
async function assignTournamentPoints(
  tournamentModalityId: string,
  tournamentCategory: TournamentCategory,
  totalRounds: number
) {
  const matches = await prisma.match.findMany({
    where: { tournamentModalityId },
    include: {
      teamARegistration: true,
      teamBRegistration: true,
      tournamentModality: true,
    },
    orderBy: { roundOrder: "desc" },
  })

  const modality = matches[0]?.tournamentModality?.modality
  const category = matches[0]?.tournamentModality?.category
  if (!modality || !category) return

  // Track which registrations have been awarded points (highest round only)
  const awardedRegistrations = new Set<string>()

  for (const match of matches) {
    if (match.winner === "NONE") continue

    const winnerId = match.winner === "TEAM_A" ? match.teamARegistrationId : match.teamBRegistrationId
    const loserId = match.winner === "TEAM_A" ? match.teamBRegistrationId : match.teamARegistrationId

    // Winner gets points if not already awarded from a higher round
    if (winnerId && !awardedRegistrations.has(winnerId)) {
      const points = getPointsForRound(tournamentCategory, match.roundOrder, true, totalRounds)
      await addPointsToRegistration(winnerId, modality, category, points)
      awardedRegistrations.add(winnerId)
    }

    // Loser gets points for their elimination round
    if (loserId && !awardedRegistrations.has(loserId)) {
      const points = getPointsForRound(tournamentCategory, match.roundOrder, false, totalRounds)
      await addPointsToRegistration(loserId, modality, category, points)
      awardedRegistrations.add(loserId)
    }
  }
}

/**
 * Add points to both players of a registration
 */
async function addPointsToRegistration(
  registrationId: string,
  modality: Modality,
  category: string,
  points: number,
  associationId: string | null = null
) {
  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
  })
  if (!registration) return

  for (const playerId of [registration.player1Id, registration.player2Id]) {
    const targets: Array<{ scope: "CITY" | "NATIONAL"; associationId: string | null }> = [
      { scope: "CITY", associationId },
      { scope: "NATIONAL", associationId: null },
    ]
    for (const target of targets) {
      await prisma.ranking.upsert({
      where: rankingUniqueWhere(playerId, modality, category, target.scope),
        update: {
          points: { increment: points },
        },
        create: {
          playerId,
          modality,
          category,
          scope: target.scope,
          associationId: target.associationId,
          points,
          played: 0,
          wins: 0,
          losses: 0,
        },
      })
    }
  }
}

/**
 * Check if a player qualifies for automatic ascension
 */
async function checkAscensionConditions(
  playerId: string,
  modality: Modality,
  category: string
) {
  // Get recent tournament results for this player
  const recentRegistrations = await prisma.tournamentRegistration.findMany({
    where: {
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
      tournamentModality: { modality, category },
    },
    include: {
      matchesAsTeamA: { orderBy: { roundOrder: "desc" } },
      matchesAsTeamB: { orderBy: { roundOrder: "desc" } },
      tournamentModality: {
        include: {
          matches: { orderBy: { roundOrder: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { registeredAt: "desc" },
    take: 5,
  })

  let tournamentsWon = 0
  let consecutiveFinals = 0
  let semifinalCount = 0

  for (const reg of recentRegistrations) {
    const allMatches = [...reg.matchesAsTeamA, ...reg.matchesAsTeamB]
    const highestRound = Math.max(...allMatches.map((m) => m.roundOrder), 0)
    const totalRounds = reg.tournamentModality.matches[0]?.roundOrder ?? highestRound

    // Check if won the tournament
    const finalMatch = allMatches.find((m) => m.roundOrder === totalRounds)
    const wonFinal =
      finalMatch &&
      ((finalMatch.teamARegistrationId === reg.id && finalMatch.winner === "TEAM_A") ||
        (finalMatch.teamBRegistrationId === reg.id && finalMatch.winner === "TEAM_B"))

    if (wonFinal) {
      tournamentsWon++
    }

    // Check if reached final
    const reachedFinal = allMatches.some((m) => m.roundOrder === totalRounds)
    if (reachedFinal) {
      consecutiveFinals++
    } else {
      consecutiveFinals = 0 // Reset if didn't reach final
    }

    // Check if reached semifinals
    const reachedSemifinal = allMatches.some(
      (m) => m.roundOrder === totalRounds - 1
    )
    if (reachedSemifinal || reachedFinal) {
      semifinalCount++
    }
  }

  const nextCategory = getNextCategory(modality, category)
  if (!nextCategory) return // Already at highest category

  // Rule 1: Won a tournament -> automatic ascension
  if (tournamentsWon > 0) {
    await createCategoryChange(
      playerId,
      modality,
      category,
      nextCategory,
      "ASCENSION",
      `Gano torneo en categoria ${category}`,
      true
    )
    return
  }

  // Rule 2: 2 consecutive finals -> automatic ascension
  if (consecutiveFinals >= 2) {
    await createCategoryChange(
      playerId,
      modality,
      category,
      nextCategory,
      "ASCENSION",
      `2 finales consecutivas en categoria ${category}`,
      true
    )
    return
  }

  // Rule 3: 3 semifinals in last 5 tournaments -> committee review
  if (semifinalCount >= 3 && recentRegistrations.length >= 5) {
    await createCategoryChange(
      playerId,
      modality,
      category,
      nextCategory,
      "ASCENSION",
      `Semifinales en 3 de ultimos 5 torneos en categoria ${category}`,
      false // needs committee review
    )
  }
}

/**
 * Get the next higher category for a given modality
 */
function getNextCategory(modality: Modality, currentCategory: string): string | null {
  const categories =
    modality === "MIXTO"
      ? ["D", "C", "B", "A"]
      : ["6ta", "5ta", "4ta", "3ra", "2da", "1ra"]

  const currentIndex = categories.indexOf(currentCategory)
  if (currentIndex === -1 || currentIndex === categories.length - 1) return null
  return categories[currentIndex + 1]
}

/**
 * Create a category change record
 */
async function createCategoryChange(
  playerId: string,
  modality: Modality,
  fromCategory: string,
  toCategory: string,
  type: "ASCENSION" | "DESCENT",
  reason: string,
  autoApproved: boolean
) {
  // Check if there's already a pending change
  const existing = await prisma.categoryChange.findFirst({
    where: {
      playerId,
      modality,
      status: "PENDING",
    },
  })

  if (existing) return // Don't create duplicate

  await prisma.categoryChange.create({
    data: {
      playerId,
      modality,
      fromCategory,
      toCategory,
      type,
      status: autoApproved ? "APPROVED" : "PENDING",
      reason,
      autoApproved,
    },
  })

  // If auto-approved, apply immediately
  if (autoApproved) {
    await applyRankingReset(playerId, modality, fromCategory, toCategory)
  }
}

/**
 * Reset player's points to 0 in the new category
 */
async function applyRankingReset(
  playerId: string,
  modality: Modality,
  _fromCategory: string,
  toCategory: string
) {
  // Create ranking entry in new category with 0 points
  const targets: Array<{ scope: "CITY" | "NATIONAL"; associationId: string | null }> = [
    { scope: "CITY", associationId: null },
    { scope: "NATIONAL", associationId: null },
  ]
  for (const target of targets) {
    await prisma.ranking.upsert({
      where: rankingUniqueWhere(playerId, modality, toCategory, target.scope),
      update: {
        points: 0,
        played: 0,
        wins: 0,
        losses: 0,
      },
      create: {
        playerId,
        modality,
        category: toCategory,
        scope: target.scope,
        associationId: target.associationId,
        points: 0,
        played: 0,
        wins: 0,
        losses: 0,
      },
    })
  }
}

/**
 * Recalculate all rankings from scratch (admin only)
 */
export async function recalculateAllRankings() {
  // Reset all rankings
  await prisma.ranking.updateMany({
    data: { points: 0, played: 0, wins: 0, losses: 0 },
  })

  // Get all completed tournament matches
  const matches = await prisma.match.findMany({
    where: {
      winner: { not: "NONE" },
      tournamentModality: {
        tournament: { status: "COMPLETED" },
      },
    },
    include: {
      tournamentModality: {
        include: { tournament: true },
      },
      teamARegistration: true,
      teamBRegistration: true,
    },
    orderBy: { playedAt: "asc" },
  })

  // Process each match
  for (const match of matches) {
    const modality = match.tournamentModality.modality
    const category = match.tournamentModality.category

    if (match.teamARegistration) {
      const won = match.winner === "TEAM_A"
      await updatePlayerRanking(match.teamARegistration.player1Id, modality, category, won)
      await updatePlayerRanking(match.teamARegistration.player2Id, modality, category, won)
    }

    if (match.teamBRegistration) {
      const won = match.winner === "TEAM_B"
      await updatePlayerRanking(match.teamBRegistration.player1Id, modality, category, won)
      await updatePlayerRanking(match.teamBRegistration.player2Id, modality, category, won)
    }
  }

  // Assign tournament points for completed tournaments
  const completedModalities = await prisma.tournamentModality.findMany({
    where: { tournament: { status: "COMPLETED" } },
    include: {
      tournament: true,
      matches: { orderBy: { roundOrder: "desc" }, take: 1 },
    },
  })

  for (const mod of completedModalities) {
    const totalRounds = mod.matches[0]?.roundOrder ?? 0
    if (totalRounds > 0) {
      await assignTournamentPoints(mod.id, mod.tournament.category, totalRounds)
    }
  }
}

function pointsForFinalStage(
  category: TournamentCategory,
  finalStage: FinalStage
) {
  const table = POINTS_TABLE[category]
  const byKeyword: Record<string, string> = {
    CHAMPION: "Campeon",
    RUNNER_UP: "Subcampeon",
    SEMIFINAL: "Semifinalista",
    QUARTERFINAL: "Cuartofinalista",
    ROUND_OF_16: "Octavos",
    ROUND_OF_32: "Dieciseisavos",
    GROUP_STAGE: "grupos",
  }
  const keyword = byKeyword[finalStage]
  const hit = table.find((row) => row.round.toLowerCase().includes(keyword.toLowerCase()))
  return hit?.points ?? 0
}

async function addDeclaredResultPoints(
  playerId: string,
  modality: Modality,
  category: string,
  cityAssociationId: string | null,
  points: number
) {
  await prisma.ranking.upsert({
    where: rankingUniqueWhere(playerId, modality, category, "CITY"),
    update: { points: { increment: points } },
    create: {
      playerId,
      modality,
      category,
      scope: "CITY",
      associationId: cityAssociationId,
      points,
      played: 0,
      wins: 0,
      losses: 0,
    },
  })
  await prisma.ranking.upsert({
    where: rankingUniqueWhere(playerId, modality, category, "NATIONAL"),
    update: { points: { increment: points } },
    create: {
      playerId,
      modality,
      category,
      scope: "NATIONAL",
      associationId: null,
      points,
      played: 0,
      wins: 0,
      losses: 0,
    },
  })
}

async function applyApprovedDeclaredResultsPoints() {
  const submissions = await prisma.tournamentResultSubmission.findMany({
    where: { status: "APPROVED" },
    include: {
      tournament: { select: { id: true, category: true } },
      rows: true,
      validatedByAssociation: { select: { id: true } },
    },
  })

  // Deduplicate by player/tournament/modality, keeping highest stage points.
  const bestByPlayerTournamentModality = new Map<
    string,
    { playerId: string; modality: Modality; category: string; points: number; associationId: string | null }
  >()

  for (const submission of submissions) {
    for (const row of submission.rows) {
      const stagePoints = pointsForFinalStage(
        submission.tournament.category as TournamentCategory,
        row.finalStage as FinalStage
      )
      if (stagePoints <= 0) continue

      const playerIds = [row.player1Id, row.player2Id].filter(Boolean) as string[]
      for (const playerId of playerIds) {
        const dedupeKey = `${submission.tournament.id}::${playerId}::${row.modality}`
        const current = bestByPlayerTournamentModality.get(dedupeKey)
        if (!current || stagePoints > current.points) {
          bestByPlayerTournamentModality.set(dedupeKey, {
            playerId,
            modality: row.modality as Modality,
            category: row.category,
            points: stagePoints,
            associationId: submission.validatedByAssociation?.id ?? null,
          })
        }
      }
    }
  }

  for (const row of bestByPlayerTournamentModality.values()) {
    await addDeclaredResultPoints(
      row.playerId,
      row.modality,
      row.category,
      row.associationId,
      row.points
    )
  }
}

export async function applyApprovedResultSubmission(_submissionId: string, _associationId: string) {
  // Keep this API for callers, but recalculate globally to guarantee
  // consistency when submissions are approved/rejected or corrected.
  await recalculateAllRankings()
}
