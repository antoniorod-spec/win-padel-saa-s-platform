import { prisma } from "@/lib/prisma"
import { checkSlotClash, type AssignedMatchLike, type SlotLike } from "./clash-detector"
import { combineDateAndTime } from "./time"

type ScheduleSummary = {
  totalMatches: number
  scheduled: number
  unscheduled: number
  unscheduledMatchIds: string[]
}

function buildSlotLike(slot: { date: Date; startTime: string; endTime: string }): SlotLike {
  return { date: slot.date, startTime: slot.startTime, endTime: slot.endTime }
}

function toMatchDateTime(slot: SlotLike): Date {
  return combineDateAndTime(slot.date, slot.startTime)
}

export async function scheduleGroupMatches(tournamentId: string): Promise<ScheduleSummary> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      modalities: {
        include: {
          groups: {
            include: { placements: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })
  if (!tournament) throw new Error("Torneo no encontrado")

  // Load available slots once.
  const slots = await prisma.matchSlot.findMany({
    where: {
      status: "AVAILABLE",
      court: { tournamentId },
    },
    include: { court: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  })
  if (slots.length === 0) throw new Error("No hay slots AVAILABLE. Genera slots primero.")

  // Seed clashes with already assigned matches in this tournament (multi-categoria).
  const existingAssigned = await prisma.match.findMany({
    where: {
      tournamentModality: { tournamentId },
      slotId: { not: null },
    },
    include: {
      slot: true,
      teamARegistration: { select: { player1Id: true, player2Id: true } },
      teamBRegistration: { select: { player1Id: true, player2Id: true } },
    },
  })

  const playerAssigned = new Map<string, AssignedMatchLike[]>()
  const addAssigned = (playerId: string, matchId: string, slot: SlotLike) => {
    const arr = playerAssigned.get(playerId) ?? []
    arr.push({ matchId, slot })
    playerAssigned.set(playerId, arr)
  }

  for (const m of existingAssigned) {
    if (!m.slot) continue
    const slotLike = buildSlotLike(m.slot)
    const players = [
      m.teamARegistration?.player1Id,
      m.teamARegistration?.player2Id,
      m.teamBRegistration?.player1Id,
      m.teamBRegistration?.player2Id,
    ].filter(Boolean) as string[]
    for (const pid of players) addAssigned(pid, m.id, slotLike)
  }

  // Clear previous schedule for group-stage in this tournament.
  await prisma.$transaction(async (tx) => {
    const groupMatchIds = await tx.match.findMany({
      where: { tournamentModality: { tournamentId }, phase: "GROUP_STAGE" },
      select: { id: true, slotId: true },
    })

    // Free their slots (if any) back to AVAILABLE.
    const slotIds = groupMatchIds.map((m) => m.slotId).filter(Boolean) as string[]
    if (slotIds.length > 0) {
      await tx.matchSlot.updateMany({
        where: { id: { in: slotIds } },
        data: { status: "AVAILABLE" },
      })
    }

    await tx.match.deleteMany({
      where: { tournamentModality: { tournamentId }, phase: "GROUP_STAGE" },
    })
  })

  // Create all group-stage matches.
  const createdMatchIds: string[] = []
  await prisma.$transaction(async (tx) => {
    for (const mod of tournament.modalities) {
      const groups = mod.groups
      if (!groups || groups.length === 0) continue

      let matchOrder = 1
      for (const g of groups) {
        const regs = g.placements.map((p) => p.registrationId)
        for (let i = 0; i < regs.length; i += 1) {
          for (let j = i + 1; j < regs.length; j += 1) {
            const created = await tx.match.create({
              data: {
                tournamentModalityId: mod.id,
                roundName: `Grupo ${g.name}`,
                roundOrder: 1,
                matchOrder,
                teamARegistrationId: regs[i],
                teamBRegistrationId: regs[j],
                phase: "GROUP_STAGE",
                groupId: g.id,
              },
              select: { id: true },
            })
            createdMatchIds.push(created.id)
            matchOrder += 1
          }
        }
      }
    }
  })

  // Load just-created matches with players for scheduling.
  const matches = await prisma.match.findMany({
    where: { id: { in: createdMatchIds } },
    include: {
      teamARegistration: { select: { id: true, player1Id: true, player2Id: true } },
      teamBRegistration: { select: { id: true, player1Id: true, player2Id: true } },
    },
    orderBy: [{ tournamentModalityId: "asc" }, { matchOrder: "asc" }],
  })

  let scheduled = 0
  const unscheduledMatchIds: string[] = []

  // Track pair rest at registration level.
  const regLastStart = new Map<string, Date>()
  const regLastEnd = new Map<string, Date>()

  for (const match of matches) {
    const a = match.teamARegistration
    const b = match.teamBRegistration
    if (!a?.id || !b?.id) {
      unscheduledMatchIds.push(match.id)
      continue
    }

    const players = [a.player1Id, a.player2Id, b.player1Id, b.player2Id]

    let assignedSlot: (typeof slots)[number] | null = null
    for (const slot of slots) {
      // Skip if already taken by a previous assignment.
      if (slot.status !== "AVAILABLE") continue
      const slotLike = buildSlotLike(slot)

      // Rest rule at pair level: require at least one slot gap.
      const slotStart = toMatchDateTime(slotLike)
      const slotEnd = combineDateAndTime(slotLike.date, slotLike.endTime)
      const lastAEnd = regLastEnd.get(a.id)
      const lastBEnd = regLastEnd.get(b.id)
      const durationMs = slotEnd.getTime() - slotStart.getTime()
      const minGapMs = durationMs // one slot gap

      if (lastAEnd && slotStart.getTime() < lastAEnd.getTime() + minGapMs) continue
      if (lastBEnd && slotStart.getTime() < lastBEnd.getTime() + minGapMs) continue

      // Player clash + min rest using already-assigned slots.
      let clash = false
      for (const pid of players) {
        const assigned = playerAssigned.get(pid) ?? []
        const res = checkSlotClash(assigned, slotLike)
        if (res.hasClash) {
          clash = true
          break
        }
      }
      if (clash) continue

      assignedSlot = slot
      break
    }

    if (!assignedSlot) {
      unscheduledMatchIds.push(match.id)
      continue
    }

    const slotLike = buildSlotLike(assignedSlot)
    const scheduledAt = toMatchDateTime(slotLike)

    // Persist assignment.
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: match.id },
        data: {
          slotId: assignedSlot!.id,
          scheduledAt,
          court: assignedSlot!.court.name,
        },
      })
      await tx.matchSlot.update({
        where: { id: assignedSlot!.id },
        data: { status: "ASSIGNED" },
      })
    })

    // Update in-memory slot status to prevent reuse.
    assignedSlot.status = "ASSIGNED"

    // Update rest tracking.
    const end = combineDateAndTime(slotLike.date, slotLike.endTime)
    regLastStart.set(a.id, scheduledAt)
    regLastEnd.set(a.id, end)
    regLastStart.set(b.id, scheduledAt)
    regLastEnd.set(b.id, end)

    // Update player clash cache.
    for (const pid of players) addAssigned(pid, match.id, slotLike)

    scheduled += 1
  }

  return {
    totalMatches: matches.length,
    scheduled,
    unscheduled: matches.length - scheduled,
    unscheduledMatchIds,
  }
}

