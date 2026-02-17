import { prisma } from "@/lib/prisma"
import { TournamentPhase } from "@prisma/client"
import { calculateModalityStandings } from "./standings"

function powerOf2BelowOrEqual(n: number): number {
  let p = 1
  while (p * 2 <= n) p *= 2
  return p
}

function roundNameForBracketSize(size: number): { phase: TournamentPhase | null; name: string } {
  switch (size) {
    case 2:
      return { phase: "FINAL", name: "Final" }
    case 4:
      return { phase: "SEMIFINAL", name: "Semifinales" }
    case 8:
      return { phase: "QUARTERFINAL", name: "Cuartos de Final" }
    case 16:
      return { phase: "ROUND_OF_16", name: "Octavos de Final" }
    case 32:
      return { phase: "ROUND_OF_32", name: "Dieciseisavos" }
    default:
      return { phase: null, name: `Ronda (${size})` }
  }
}

type QualifiedTeam = {
  registrationId: string
  rankingScore: number
  position: "FIRST" | "SECOND"
  groupOrder: number
}

export async function generateMirrorBracket(tournamentId: string, tournamentModalityId: string, userId: string) {
  const modality = await prisma.tournamentModality.findUnique({
    where: { id: tournamentModalityId },
    include: {
      tournament: { include: { club: true } },
      groups: { orderBy: { order: "asc" } },
    },
  })
  if (!modality) throw new Error("Modalidad no encontrada")
  if (modality.tournamentId !== tournamentId) throw new Error("La modalidad no pertenece a este torneo")
  if (modality.tournament.club.userId !== userId) throw new Error("No autorizado")

  // Ensure we have groups + standings.
  const standings = await calculateModalityStandings(tournamentModalityId)
  if (standings.groups.length === 0) throw new Error("No hay grupos generados")

  // Build qualified list: top2 per group.
  const qualified: QualifiedTeam[] = []
  for (const g of standings.groups) {
    const group = modality.groups.find((x) => x.name === g.groupName)
    const groupOrder = group?.order ?? 0
    const top2 = g.standings.slice(0, 2)
    if (top2.length < 2) throw new Error(`El grupo ${g.groupName} no tiene 2 parejas clasificables`)
    qualified.push({
      registrationId: top2[0].registrationId,
      rankingScore: await readRankingScore(top2[0].registrationId),
      position: "FIRST",
      groupOrder,
    })
    qualified.push({
      registrationId: top2[1].registrationId,
      rankingScore: await readRankingScore(top2[1].registrationId),
      position: "SECOND",
      groupOrder,
    })
  }

  // Mirror ordering for initial seeding.
  const firsts = qualified.filter((q) => q.position === "FIRST").sort((a, b) => a.groupOrder - b.groupOrder)
  const seconds = qualified.filter((q) => q.position === "SECOND").sort((a, b) => a.groupOrder - b.groupOrder).reverse()

  const mirrored: QualifiedTeam[] = []
  for (let i = 0; i < Math.min(firsts.length, seconds.length); i += 1) {
    mirrored.push(firsts[i])
    mirrored.push(seconds[i])
  }

  const total = mirrored.length
  const bracketSize = powerOf2BelowOrEqual(total)
  const prelimMatches = total - bracketSize
  const byesCount = bracketSize - prelimMatches

  // Clean previous elimination matches (keep group-stage).
  await prisma.match.deleteMany({
    where: {
      tournamentModalityId: tournamentModalityId,
      phase: { not: "GROUP_STAGE" },
    },
  })

  // Choose byes: top rankingScore among all qualifiers.
  const byes = [...mirrored].sort((a, b) => b.rankingScore - a.rankingScore).slice(0, Math.max(0, byesCount))
  const byeSet = new Set(byes.map((b) => b.registrationId))

  const prelimTeams = mirrored.filter((t) => !byeSet.has(t.registrationId))
  if (prelimMatches * 2 !== prelimTeams.length) {
    // Defensive: if math doesn't align, fallback to no-prelim behavior.
    throw new Error("No se pudo armar la ronda previa con las parejas clasificadas")
  }

  // Prelim pairing: best remaining vs worst remaining.
  const prelimSorted = [...prelimTeams].sort((a, b) => b.rankingScore - a.rankingScore)
  const prelimPairs: Array<[QualifiedTeam, QualifiedTeam]> = []
  for (let i = 0; i < prelimMatches; i += 1) {
    prelimPairs.push([prelimSorted[i], prelimSorted[prelimSorted.length - 1 - i]])
  }

  // Create prelim matches (roundOrder=1)
  if (prelimMatches > 0) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < prelimPairs.length; i += 1) {
        const [a, b] = prelimPairs[i]
        await tx.match.create({
          data: {
            tournamentModalityId: tournamentModalityId,
            roundName: "Ronda Previa",
            roundOrder: 1,
            matchOrder: i + 1,
            teamARegistrationId: a.registrationId,
            teamBRegistrationId: b.registrationId,
            phase: "PRELIMINARY_ROUND",
          },
        })
      }
    })
  }

  // Create main bracket (roundOrder=2..)
  const main = roundNameForBracketSize(bracketSize)
  const mainMatchCount = bracketSize / 2

  // Assign byes into the earliest slots (teamA of the first N matches),
  // then fill the remaining main slots with prelim winners later.
  const mainMatches = await prisma.$transaction(async (tx) => {
    const created = []
    for (let i = 0; i < mainMatchCount; i += 1) {
      const bye = byes[i] ?? null
      const m = await tx.match.create({
        data: {
          tournamentModalityId: tournamentModalityId,
          roundName: main.name,
          roundOrder: 2,
          matchOrder: i + 1,
          teamARegistrationId: bye ? bye.registrationId : null,
          teamBRegistrationId: null,
            phase: main.phase ?? undefined,
        },
      })
      created.push(m)
    }

    // Subsequent rounds scaffold.
    let currentSize = bracketSize / 2
    let roundOrder = 3
    while (currentSize >= 2) {
      const info = roundNameForBracketSize(currentSize)
      const count = currentSize / 2
      for (let i = 0; i < count; i += 1) {
        await tx.match.create({
          data: {
            tournamentModalityId: tournamentModalityId,
            roundName: info.name,
            roundOrder,
            matchOrder: i + 1,
            teamARegistrationId: null,
            teamBRegistrationId: null,
            phase: info.phase ?? undefined,
          },
        })
      }
      currentSize /= 2
      roundOrder += 1
    }

    return created
  })

  return {
    totalQualified: total,
    prelimMatches,
    byes: byesCount,
    mainRound: main.name,
    mainMatches: mainMatches.length,
  }
}

async function readRankingScore(registrationId: string): Promise<number> {
  const reg = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    select: { rankingScore: true },
  })
  return reg?.rankingScore ?? 0
}

