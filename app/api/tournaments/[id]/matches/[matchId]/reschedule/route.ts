import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { checkSlotClash, type AssignedMatchLike } from "@/lib/tournament/clash-detector"
import { combineDateAndTime } from "@/lib/tournament/time"

const schema = z.object({
  newSlotId: z.string().cuid(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id, matchId } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { club: true },
    })
    if (!tournament) return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    if (session!.user.role !== "ADMIN" && tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        slot: true,
        teamARegistration: { select: { player1Id: true, player2Id: true } },
        teamBRegistration: { select: { player1Id: true, player2Id: true } },
        tournamentModality: { include: { tournament: true } },
      },
    })
    if (!match || match.tournamentModality.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Partido no encontrado" }, { status: 404 })
    }

    const newSlot = await prisma.matchSlot.findUnique({
      where: { id: parsed.data.newSlotId },
      include: { court: true },
    })
    if (!newSlot || newSlot.court.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Slot no encontrado" }, { status: 404 })
    }
    if (newSlot.status !== "AVAILABLE") {
      return NextResponse.json({ success: false, error: "El slot no esta disponible" }, { status: 400 })
    }

    const players = [
      match.teamARegistration?.player1Id,
      match.teamARegistration?.player2Id,
      match.teamBRegistration?.player1Id,
      match.teamBRegistration?.player2Id,
    ].filter(Boolean) as string[]

    // Gather assigned matches for these players excluding this match.
    const assignedMatches = await prisma.match.findMany({
      where: {
        tournamentModality: { tournamentId: id },
        id: { not: matchId },
        slotId: { not: null },
        OR: [
          { teamARegistration: { is: { player1Id: { in: players } } } },
          { teamARegistration: { is: { player2Id: { in: players } } } },
          { teamBRegistration: { is: { player1Id: { in: players } } } },
          { teamBRegistration: { is: { player2Id: { in: players } } } },
        ],
      },
      include: {
        slot: true,
        teamARegistration: { select: { player1Id: true, player2Id: true } },
        teamBRegistration: { select: { player1Id: true, player2Id: true } },
      },
      take: 2000,
    })

    const playerAssigned = new Map<string, AssignedMatchLike[]>()
    for (const m of assignedMatches) {
      if (!m.slot) continue
      const slot = { date: m.slot.date, startTime: m.slot.startTime, endTime: m.slot.endTime }
      const pids = [
        m.teamARegistration?.player1Id,
        m.teamARegistration?.player2Id,
        m.teamBRegistration?.player1Id,
        m.teamBRegistration?.player2Id,
      ].filter(Boolean) as string[]
      for (const pid of pids) {
        const arr = playerAssigned.get(pid) ?? []
        arr.push({ matchId: m.id, slot })
        playerAssigned.set(pid, arr)
      }
    }

    const proposedSlot = { date: newSlot.date, startTime: newSlot.startTime, endTime: newSlot.endTime }
    for (const pid of players) {
      const res = checkSlotClash(playerAssigned.get(pid) ?? [], proposedSlot)
      if (res.hasClash) {
        return NextResponse.json({ success: false, error: "Conflicto de horario por empalme/descanso minimo" }, { status: 409 })
      }
    }

    await prisma.$transaction(async (tx) => {
      if (match.slotId) {
        await tx.matchSlot.update({
          where: { id: match.slotId },
          data: { status: "AVAILABLE" },
        })
      }
      await tx.match.update({
        where: { id: matchId },
        data: {
          slotId: newSlot.id,
          scheduledAt: combineDateAndTime(newSlot.date, newSlot.startTime),
          court: newSlot.court.name,
        },
      })
      await tx.matchSlot.update({
        where: { id: newSlot.id },
        data: { status: "ASSIGNED" },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error rescheduling match:", err)
    return NextResponse.json({ success: false, error: "Error al reprogramar partido" }, { status: 500 })
  }
}

