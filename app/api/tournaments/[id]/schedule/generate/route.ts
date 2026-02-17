import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { scheduleGroupMatches } from "@/lib/tournament/schedule-matches"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const result = await scheduleGroupMatches(id)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error("Error generating schedule:", err)
    const message = err instanceof Error ? err.message : "Error al generar calendario"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

