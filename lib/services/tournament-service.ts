import { prisma } from "@/lib/prisma"

/**
 * Generate a bracket (elimination matches) for a tournament modality
 */
export async function generateBracket(
  tournamentId: string,
  modalityId: string,
  userId: string
) {
  // Verify the tournament and permissions
  const modality = await prisma.tournamentModality.findUnique({
    where: { id: modalityId },
    include: {
      tournament: { include: { club: true } },
      registrations: {
        where: { paymentStatus: "CONFIRMED" },
        include: {
          player1: { include: { rankings: true } },
          player2: { include: { rankings: true } },
        },
      },
      matches: true,
    },
  })

  if (!modality) {
    throw new Error("Modalidad no encontrada")
  }

  if (modality.tournament.id !== tournamentId) {
    throw new Error("La modalidad no pertenece a este torneo")
  }

  if (
    modality.tournament.club.userId !== userId
  ) {
    throw new Error("No autorizado para generar bracket en este torneo")
  }

  if (modality.matches.length > 0) {
    throw new Error("Ya existe un bracket para esta modalidad. Elimina los partidos primero.")
  }

  const registrations = modality.registrations
  if (registrations.length < 2) {
    throw new Error("Se necesitan al menos 2 parejas confirmadas para generar el bracket")
  }

  // Sort by combined ranking points (seed)
  const seeded = registrations
    .map((reg) => {
      const p1Points = reg.player1.rankings.find(
        (r) => r.modality === modality.modality && r.category === modality.category
      )?.points ?? 0
      const p2Points = reg.player2.rankings.find(
        (r) => r.modality === modality.modality && r.category === modality.category
      )?.points ?? 0
      return {
        ...reg,
        combinedPoints: p1Points + p2Points,
      }
    })
    .sort((a, b) => b.combinedPoints - a.combinedPoints)

  // Assign seeds
  for (let i = 0; i < seeded.length; i++) {
    await prisma.tournamentRegistration.update({
      where: { id: seeded[i].id },
      data: { seed: i + 1 },
    })
  }

  if (modality.tournament.format === "LEAGUE") {
    const createdLeagueMatches = await createLeagueMatches(modalityId, seeded)
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "IN_PROGRESS" },
    })
    return {
      mode: "LEAGUE",
      totalRounds: 1,
      totalMatches: createdLeagueMatches,
      teams: seeded.length,
      byes: 0,
    }
  }

  if (modality.tournament.format === "ROUND_ROBIN") {
    const { groupMatches, qualifiers } = await createRoundRobinWithPlayoff(modalityId, seeded)
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "IN_PROGRESS" },
    })
    return {
      mode: "ROUND_ROBIN",
      totalRounds: qualifiers > 0 ? Math.log2(nextPowerOf2(qualifiers)) + 1 : 1,
      totalMatches: groupMatches,
      teams: seeded.length,
      byes: 0,
    }
  }

  // ELIMINATION / EXPRESS
  const teamCount = seeded.length
  const bracketSize = nextPowerOf2(teamCount)
  const totalRounds = Math.log2(bracketSize)
  const byes = bracketSize - teamCount

  // Create the bracket with seeding
  const roundNames = getRoundNames(totalRounds)
  const matches: {
    roundName: string
    roundOrder: number
    matchOrder: number
    teamARegistrationId: string | null
    teamBRegistrationId: string | null
  }[] = []

  // First round: create matches with seeded positions
  const firstRoundMatchCount = bracketSize / 2
  const firstRoundTeams = seedBracket(seeded.map((s) => s.id), bracketSize)

  for (let i = 0; i < firstRoundMatchCount; i++) {
    const teamAId = firstRoundTeams[i * 2] ?? null
    const teamBId = firstRoundTeams[i * 2 + 1] ?? null

    matches.push({
      roundName: roundNames[0],
      roundOrder: 1,
      matchOrder: i + 1,
      teamARegistrationId: teamAId,
      teamBRegistrationId: teamBId,
    })
  }

  // Create subsequent rounds (empty)
  for (let round = 1; round < totalRounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round + 1)
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        roundName: roundNames[round],
        roundOrder: round + 1,
        matchOrder: i + 1,
        teamARegistrationId: null,
        teamBRegistrationId: null,
      })
    }
  }

  // Insert all matches
  const createdMatches = []
  for (const match of matches) {
    const created = await prisma.match.create({
      data: {
        tournamentModalityId: modalityId,
        ...match,
      },
    })
    createdMatches.push(created)
  }

  // Auto-advance byes in first round
  const firstRoundMatches = createdMatches.filter((m) => m.roundOrder === 1)
  const secondRoundMatches = createdMatches.filter((m) => m.roundOrder === 2)

  for (let i = 0; i < firstRoundMatches.length; i++) {
    const match = firstRoundMatches[i]
    if (match.teamARegistrationId && !match.teamBRegistrationId) {
      // Team A advances (bye)
      await prisma.match.update({
        where: { id: match.id },
        data: { winner: "TEAM_A" },
      })
      // Advance to next round
      const nextMatchIndex = Math.floor(i / 2)
      if (secondRoundMatches[nextMatchIndex]) {
        const field = i % 2 === 0 ? "teamARegistrationId" : "teamBRegistrationId"
        await prisma.match.update({
          where: { id: secondRoundMatches[nextMatchIndex].id },
          data: { [field]: match.teamARegistrationId },
        })
      }
    } else if (!match.teamARegistrationId && match.teamBRegistrationId) {
      // Team B advances (bye)
      await prisma.match.update({
        where: { id: match.id },
        data: { winner: "TEAM_B" },
      })
      const nextMatchIndex = Math.floor(i / 2)
      if (secondRoundMatches[nextMatchIndex]) {
        const field = i % 2 === 0 ? "teamARegistrationId" : "teamBRegistrationId"
        await prisma.match.update({
          where: { id: secondRoundMatches[nextMatchIndex].id },
          data: { [field]: match.teamBRegistrationId },
        })
      }
    }
  }

  // Update tournament status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "IN_PROGRESS" },
  })

  return {
    mode: modality.tournament.format,
    totalRounds,
    totalMatches: createdMatches.length,
    teams: seeded.length,
    byes,
  }
}

/**
 * Advance a winner to the next round in the bracket
 */
export async function advanceWinner(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournamentModality: {
        include: {
          matches: { orderBy: [{ roundOrder: "asc" }, { matchOrder: "asc" }] },
        },
      },
    },
  })

  if (!match || match.winner === "NONE") return

  const winnerId =
    match.winner === "TEAM_A"
      ? match.teamARegistrationId
      : match.teamBRegistrationId

  if (!winnerId) return

  // Find the next round match
  const nextRoundMatches = match.tournamentModality.matches.filter(
    (m) => m.roundOrder === match.roundOrder + 1
  )

  if (nextRoundMatches.length === 0) return // This was the final

  // Calculate which next-round match this feeds into
  const currentRoundMatches = match.tournamentModality.matches.filter(
    (m) => m.roundOrder === match.roundOrder
  )

  const matchIndex = currentRoundMatches.findIndex((m) => m.id === match.id)
  const nextMatchIndex = Math.floor(matchIndex / 2)

  if (nextMatchIndex >= nextRoundMatches.length) return

  const nextMatch = nextRoundMatches[nextMatchIndex]
  const field = matchIndex % 2 === 0 ? "teamARegistrationId" : "teamBRegistrationId"

  await prisma.match.update({
    where: { id: nextMatch.id },
    data: { [field]: winnerId },
  })
}

// ============================================================
// Helper functions
// ============================================================

function nextPowerOf2(n: number): number {
  let power = 1
  while (power < n) power *= 2
  return power
}

function getRoundNames(totalRounds: number): string[] {
  const names: string[] = []
  for (let i = totalRounds; i >= 1; i--) {
    switch (i) {
      case 1:
        names.unshift("Final")
        break
      case 2:
        names.unshift("Semifinales")
        break
      case 3:
        names.unshift("Cuartos de Final")
        break
      case 4:
        names.unshift("Octavos de Final")
        break
      case 5:
        names.unshift("Dieciseisavos")
        break
      default:
        names.unshift(`Ronda ${totalRounds - i + 1}`)
    }
  }
  return names
}

/**
 * Create a standard seeded bracket placement
 * Seed 1 vs Seed N, Seed 2 vs Seed N-1, etc.
 */
function seedBracket(teamIds: string[], bracketSize: number): (string | null)[] {
  const slots: (string | null)[] = new Array(bracketSize).fill(null)

  // Standard bracket seeding positions
  const positions = generateSeedPositions(bracketSize)

  for (let i = 0; i < teamIds.length; i++) {
    slots[positions[i]] = teamIds[i]
  }

  return slots
}

function generateSeedPositions(size: number): number[] {
  if (size === 2) return [0, 1]

  const half = size / 2
  const positions = generateSeedPositions(half)

  const result: number[] = []
  for (const pos of positions) {
    result.push(pos * 2)
    result.push(size - 1 - pos * 2)
  }

  return result
}

async function createLeagueMatches(
  modalityId: string,
  seeded: Array<{ id: string }>
) {
  let created = 0
  for (let i = 0; i < seeded.length; i++) {
    for (let j = i + 1; j < seeded.length; j++) {
      await prisma.match.create({
        data: {
          tournamentModalityId: modalityId,
          roundName: "Liga",
          roundOrder: 1,
          matchOrder: created + 1,
          teamARegistrationId: seeded[i].id,
          teamBRegistrationId: seeded[j].id,
        },
      })
      created += 1
    }
  }
  return created
}

async function createRoundRobinWithPlayoff(
  modalityId: string,
  seeded: Array<{ id: string }>
) {
  const groupSize = 4
  const groupsCount =
    seeded.length <= groupSize
      ? 1
      : Math.max(2, Math.ceil(seeded.length / groupSize))
  const groups: string[][] = Array.from({ length: groupsCount }, () => [])

  // Snake seeding distribution
  seeded.forEach((team, index) => {
    const bucket = index % groupsCount
    const reverse = Math.floor(index / groupsCount) % 2 === 1
    const groupIndex = reverse ? groupsCount - 1 - bucket : bucket
    groups[groupIndex].push(team.id)
  })

  let createdGroupMatches = 0
  for (let g = 0; g < groups.length; g++) {
    const teamIds = groups[g]
    const groupName = `Grupo ${String.fromCharCode(65 + g)}`
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        await prisma.match.create({
          data: {
            tournamentModalityId: modalityId,
            roundName: groupName,
            roundOrder: 1,
            matchOrder: createdGroupMatches + 1,
            teamARegistrationId: teamIds[i],
            teamBRegistrationId: teamIds[j],
          },
        })
        createdGroupMatches += 1
      }
    }
  }

  // Create playoff scaffold (top 2 by group)
  const qualifiers = Math.max(4, groupsCount * 2)
  const playoffSize = nextPowerOf2(qualifiers)
  const playoffRounds = Math.log2(playoffSize)
  const roundNames = getRoundNames(playoffRounds)

  for (let r = 0; r < playoffRounds; r++) {
    const matchCount = playoffSize / Math.pow(2, r + 1)
    for (let m = 0; m < matchCount; m++) {
      await prisma.match.create({
        data: {
          tournamentModalityId: modalityId,
          roundName: `Playoff - ${roundNames[r]}`,
          roundOrder: r + 2,
          matchOrder: m + 1,
          teamARegistrationId: null,
          teamBRegistrationId: null,
        },
      })
    }
  }

  return { groupMatches: createdGroupMatches, qualifiers }
}
