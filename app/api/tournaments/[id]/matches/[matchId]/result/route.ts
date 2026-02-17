import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { calculateGroupStandings } from "@/lib/tournament/standings"
import { advanceAutomationWinner } from "@/lib/tournament/advance-winner"

const scoreSetSchema = z.object({
  setA: z.number().int().min(0).max(99),
  setB: z.number().int().min(0).max(99),
})

const schema = z.object({
  scores: z.array(scoreSetSchema).min(1).max(5),
  winner: z.enum(["TEAM_A", "TEAM_B"]),
})

export async function POST(
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
      include: { tournamentModality: true },
    })
    if (!match || match.tournamentModality.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Partido no encontrado" }, { status: 404 })
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        scores: parsed.data.scores,
        winner: parsed.data.winner,
        playedAt: new Date(),
      },
    })

    // If group-stage, recompute standings.
    if (match.groupId) {
      await calculateGroupStandings(match.groupId)
    }

    // If eliminations, advance to next round.
    if (!match.groupId && match.winner !== "NONE") {
      await advanceAutomationWinner(matchId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error saving match result:", err)
    return NextResponse.json({ success: false, error: "Error al guardar resultado" }, { status: 500 })
  }
}

