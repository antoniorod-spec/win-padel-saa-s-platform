import { prisma } from "@/lib/prisma"

type ScoreSet = { setA: number; setB: number }

function computeSetsAndGames(scores: ScoreSet[]): {
  setsA: number
  setsB: number
  gamesA: number
  gamesB: number
} {
  let setsA = 0
  let setsB = 0
  let gamesA = 0
  let gamesB = 0

  for (const s of scores) {
    gamesA += s.setA ?? 0
    gamesB += s.setB ?? 0
    if ((s.setA ?? 0) > (s.setB ?? 0)) setsA += 1
    else if ((s.setB ?? 0) > (s.setA ?? 0)) setsB += 1
  }

  return { setsA, setsB, gamesA, gamesB }
}

export async function calculateGroupStandings(groupId: string) {
  const group = await prisma.tournamentGroup.findUnique({
    where: { id: groupId },
    include: {
      placements: true,
      matches: true,
    },
  })
  if (!group) throw new Error("Grupo no encontrado")

  const placements = group.placements
  if (placements.length === 0) return []

  const stats = new Map<string, {
    registrationId: string
    matchesPlayed: number
    matchesWon: number
    matchesLost: number
    setsWon: number
    setsLost: number
    gamesWon: number
    gamesLost: number
    points: number
  }>()

  for (const p of placements) {
    stats.set(p.registrationId, {
      registrationId: p.registrationId,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    })
  }

  // Head-to-head map (only used for 2-way ties)
  const h2hWinner = new Map<string, "A" | "B">() // key: "reg1|reg2" sorted

  for (const m of group.matches) {
    if (!m.teamARegistrationId || !m.teamBRegistrationId) continue
    if (m.winner === "NONE") continue

    const scores = (m.scores as ScoreSet[]) ?? []
    const { setsA, setsB, gamesA, gamesB } = computeSetsAndGames(scores)

    const a = stats.get(m.teamARegistrationId)
    const b = stats.get(m.teamBRegistrationId)
    if (!a || !b) continue

    a.matchesPlayed += 1
    b.matchesPlayed += 1
    a.setsWon += setsA
    a.setsLost += setsB
    a.gamesWon += gamesA
    a.gamesLost += gamesB
    b.setsWon += setsB
    b.setsLost += setsA
    b.gamesWon += gamesB
    b.gamesLost += gamesA

    if (m.winner === "TEAM_A") {
      a.matchesWon += 1
      a.points += 3
      b.matchesLost += 1
    } else if (m.winner === "TEAM_B") {
      b.matchesWon += 1
      b.points += 3
      a.matchesLost += 1
    }

    const key = [m.teamARegistrationId, m.teamBRegistrationId].sort().join("|")
    h2hWinner.set(key, m.winner === "TEAM_A" ? "A" : "B")
  }

  const rows = Array.from(stats.values())

  const baseCompare = (x: typeof rows[number], y: typeof rows[number]) => {
    const xSetDiff = x.setsWon - x.setsLost
    const ySetDiff = y.setsWon - y.setsLost
    const xGameDiff = x.gamesWon - x.gamesLost
    const yGameDiff = y.gamesWon - y.gamesLost
    return (
      y.points - x.points ||
      ySetDiff - xSetDiff ||
      yGameDiff - xGameDiff
    )
  }

  rows.sort((x, y) => {
    const cmp = baseCompare(x, y)
    if (cmp !== 0) return cmp

    // Direct result tie-break (only robust for 2-way ties)
    const key = [x.registrationId, y.registrationId].sort().join("|")
    const winner = h2hWinner.get(key)
    if (!winner) return 0
    const xIsA = x.registrationId === key.split("|")[0]
    const xWon = (winner === "A" && xIsA) || (winner === "B" && !xIsA)
    return xWon ? -1 : 1
  })

  // Persist placements
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i]
      await tx.groupPlacement.updateMany({
        where: { groupId, registrationId: r.registrationId },
        data: {
          position: i + 1,
          matchesPlayed: r.matchesPlayed,
          matchesWon: r.matchesWon,
          matchesLost: r.matchesLost,
          setsWon: r.setsWon,
          setsLost: r.setsLost,
          gamesWon: r.gamesWon,
          gamesLost: r.gamesLost,
          points: r.points,
        },
      })
    }
  })

  return rows.map((r, idx) => ({ ...r, position: idx + 1 }))
}

export async function calculateModalityStandings(tournamentModalityId: string) {
  const groups = await prisma.tournamentGroup.findMany({
    where: { tournamentModalityId },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  })

  const out = []
  for (const g of groups) {
    const standings = await calculateGroupStandings(g.id)
    out.push({ groupName: g.name, standings })
  }
  return { groups: out }
}

