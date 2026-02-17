import { prisma } from "@/lib/prisma"

type GeneratedGroup = {
  id: string
  name: string
  groupSize: number
  order: number
  placements: Array<{
    registrationId: string
    seed: number | null
    rankingScore: number | null
  }>
}

function computeGroupCounts(n: number): { groups3: number; groups4: number } {
  // Business rule: prioritize groups of 3; only groups of 4 when remainder exists.
  if (n % 3 === 0) return { groups3: n / 3, groups4: 0 }
  if (n % 3 === 1) return { groups3: (n - 4) / 3, groups4: 1 }
  return { groups3: (n - 4) / 3, groups4: 1 } // n%3===2
}

function pickRankingPoints(rankings: Array<{ modality: any; category: string; points: number }>, modality: any, category: string): number {
  // Use the max points for the exact modality+category; fallback to 0.
  const matches = rankings.filter((r) => r.modality === modality && r.category === category)
  if (matches.length === 0) return 0
  return Math.max(...matches.map((m) => m.points ?? 0))
}

export async function generateGroups(tournamentModalityId: string): Promise<GeneratedGroup[]> {
  const modality = await prisma.tournamentModality.findUnique({
    where: { id: tournamentModalityId },
    include: {
      tournament: true,
      registrations: {
        where: { paymentStatus: { in: ["PENDING", "CONFIRMED"] } },
        include: {
          player1: { include: { rankings: true } },
          player2: { include: { rankings: true } },
        },
      },
      groups: true,
    },
  })

  if (!modality) throw new Error("Modalidad no encontrada")

  const minPairs = modality.minPairs ?? modality.tournament.minPairsPerModality
  const regs = modality.registrations
  if (regs.length < minPairs) {
    throw new Error(`No hay suficientes parejas para generar grupos (minimo ${minPairs})`)
  }

  const ranked = regs
    .map((r) => {
      const p1 = pickRankingPoints(r.player1.rankings as any, modality.modality, modality.category)
      const p2 = pickRankingPoints(r.player2.rankings as any, modality.modality, modality.category)
      const rankingScore = p1 + p2
      return { reg: r, rankingScore }
    })
    .sort((a, b) => b.rankingScore - a.rankingScore)

  const n = ranked.length
  const { groups3, groups4 } = computeGroupCounts(n)
  const totalGroups = groups3 + groups4

  if (!Number.isInteger(groups3) || !Number.isInteger(groups4) || groups3 < 0 || totalGroups <= 0) {
    throw new Error("No se pudo calcular la cantidad de grupos con las parejas actuales")
  }

  // Seed each registration by ranking order (used by other parts of the system too).
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < ranked.length; i += 1) {
      await tx.tournamentRegistration.update({
        where: { id: ranked[i].reg.id },
        data: {
          seed: i + 1,
          rankingScore: ranked[i].rankingScore,
        },
      })
    }
  })

  // Prepare initial groups with 1 seed each.
  const seeds = ranked.slice(0, totalGroups)
  const rest = ranked.slice(totalGroups)

  const buckets: Array<{
    name: string
    groupSize: number
    order: number
    regs: Array<{ registrationId: string; seed: number | null; rankingScore: number }>
  }> = []

  for (let i = 0; i < totalGroups; i += 1) {
    const name = String.fromCharCode(65 + i) // A, B, C...
    const groupSize = i < groups3 ? 3 : 4
    const seedReg = seeds[i]
    buckets.push({
      name,
      groupSize,
      order: i + 1,
      regs: seedReg
        ? [{ registrationId: seedReg.reg.id, seed: 1, rankingScore: seedReg.rankingScore }]
        : [],
    })
  }

  // Serpentina distribution for remaining regs.
  let direction: 1 | -1 = 1
  let idx = 0
  for (const item of rest) {
    // Find next bucket with space.
    while (buckets[idx] && buckets[idx].regs.length >= buckets[idx].groupSize) {
      idx += direction
      if (idx >= totalGroups) {
        direction = -1
        idx = totalGroups - 1
      } else if (idx < 0) {
        direction = 1
        idx = 0
      }
    }
    buckets[idx].regs.push({ registrationId: item.reg.id, seed: null, rankingScore: item.rankingScore })

    idx += direction
    if (idx >= totalGroups) {
      direction = -1
      idx = totalGroups - 1
    } else if (idx < 0) {
      direction = 1
      idx = 0
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    // Clean previous generation artifacts for this modality.
    await tx.match.deleteMany({
      where: {
        tournamentModalityId,
        groupId: { not: null },
      },
    })
    await tx.tournamentGroup.deleteMany({
      where: { tournamentModalityId },
    })

    const out: GeneratedGroup[] = []
    for (const b of buckets) {
      const group = await tx.tournamentGroup.create({
        data: {
          tournamentModalityId,
          name: b.name,
          groupSize: b.groupSize,
          order: b.order,
          placements: {
            create: b.regs.map((r) => ({
              registrationId: r.registrationId,
              seed: r.seed ?? undefined,
            })),
          },
        },
        include: {
          placements: {
            include: { registration: { select: { rankingScore: true } } },
            orderBy: [{ seed: "asc" }, { id: "asc" }],
          },
        },
      })
      out.push({
        id: group.id,
        name: group.name,
        groupSize: group.groupSize,
        order: group.order,
        placements: group.placements.map((p) => ({
          registrationId: p.registrationId,
          seed: p.seed ?? null,
          rankingScore: p.registration.rankingScore ?? null,
        })),
      })
    }
    return out
  })

  return created.sort((a, b) => a.order - b.order)
}

