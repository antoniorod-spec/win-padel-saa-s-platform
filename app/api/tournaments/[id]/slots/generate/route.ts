import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { generateSlots } from "@/lib/tournament/generate-slots"

async function assertTournamentOwner(tournamentId: string, userId: string, role: string) {
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { club: true },
  })
  if (!t) return { ok: false as const, response: NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 }) }
  if (role !== "ADMIN" && t.club.userId !== userId) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const authz = await assertTournamentOwner(id, session!.user.id, session!.user.role)
    if (!authz.ok) return authz.response

    const result = await generateSlots(id)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error("Error generating slots:", err)
    const message = err instanceof Error ? err.message : "Error al generar slots"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

