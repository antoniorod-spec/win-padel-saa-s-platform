import { prisma } from "@/lib/prisma"

/**
 * Apply a category change (ascension or descent)
 * Resets points to 0 in the new category
 */
export async function applyCategoryChange(categoryChangeId: string) {
  const change = await prisma.categoryChange.findUnique({
    where: { id: categoryChangeId },
  })

  if (!change) {
    throw new Error("Cambio de categoria no encontrado")
  }

  // Reset points in new category
  await prisma.ranking.upsert({
    where: {
      playerId_modality_category: {
        playerId: change.playerId,
        modality: change.modality,
        category: change.toCategory,
      },
    },
    update: {
      points: 0,
      played: 0,
      wins: 0,
      losses: 0,
    },
    create: {
      playerId: change.playerId,
      modality: change.modality,
      category: change.toCategory,
      points: 0,
      played: 0,
      wins: 0,
      losses: 0,
    },
  })

  return change
}

/**
 * Check descent eligibility for a player
 * Rule: eliminated in 1st round in 5 consecutive tournaments
 */
export async function checkDescentEligibility(
  playerId: string,
  modality: "VARONIL" | "FEMENIL" | "MIXTO",
  category: string
): Promise<boolean> {
  const registrations = await prisma.tournamentRegistration.findMany({
    where: {
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
      tournamentModality: {
        modality,
        category,
        tournament: { status: "COMPLETED" },
      },
    },
    include: {
      matchesAsTeamA: { orderBy: { roundOrder: "asc" }, take: 1 },
      matchesAsTeamB: { orderBy: { roundOrder: "asc" }, take: 1 },
    },
    orderBy: { registeredAt: "desc" },
    take: 5,
  })

  if (registrations.length < 5) return false

  // Check if eliminated in first round in all 5
  let consecutiveFirstRoundEliminations = 0

  for (const reg of registrations) {
    const firstMatch =
      reg.matchesAsTeamA[0] ?? reg.matchesAsTeamB[0]

    if (!firstMatch) continue

    const isTeamA = reg.matchesAsTeamA.length > 0
    const lost =
      (isTeamA && firstMatch.winner === "TEAM_B") ||
      (!isTeamA && firstMatch.winner === "TEAM_A")

    // Check if this was a first-round match (lowest roundOrder > 1 for elimination)
    if (lost && firstMatch.roundOrder <= 2) {
      consecutiveFirstRoundEliminations++
    } else {
      break // Not consecutive
    }
  }

  return consecutiveFirstRoundEliminations >= 5
}

/**
 * Request a descent for a player
 */
export async function requestDescent(
  playerId: string,
  modality: "VARONIL" | "FEMENIL" | "MIXTO",
  currentCategory: string
) {
  const categories =
    modality === "MIXTO"
      ? ["D", "C", "B", "A"]
      : ["6ta", "5ta", "4ta", "3ra", "2da", "1ra"]

  const currentIndex = categories.indexOf(currentCategory)
  if (currentIndex <= 0) {
    throw new Error("Ya esta en la categoria mas baja")
  }

  const previousCategory = categories[currentIndex - 1]

  const isEligible = await checkDescentEligibility(playerId, modality, currentCategory)
  if (!isEligible) {
    throw new Error(
      "No cumple los requisitos para descenso (5 eliminaciones en 1ra ronda consecutivas)"
    )
  }

  // Create pending category change
  await prisma.categoryChange.create({
    data: {
      playerId,
      modality,
      fromCategory: currentCategory,
      toCategory: previousCategory,
      type: "DESCENT",
      status: "PENDING",
      reason: "Solicitud de descenso - eliminado en 1ra ronda en 5 torneos consecutivos",
      autoApproved: false,
    },
  })

  return { from: currentCategory, to: previousCategory }
}
