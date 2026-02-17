import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

async function assertTournamentOwner(tournamentId: string, userId: string, role: string) {
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { club: true },
  })
  if (!t)
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 }) }
  if (role !== "ADMIN" && t.club.userId !== userId) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { id, registrationId } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const authz = await assertTournamentOwner(id, session!.user.id, session!.user.role)
    if (!authz.ok) return authz.response

    const reg = await prisma.tournamentRegistration.findFirst({
      where: { id: registrationId },
      include: { tournamentModality: true },
    })
    if (!reg || reg.tournamentModality.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Inscripcion no encontrada" }, { status: 404 })
    }

    await prisma.tournamentRegistration.delete({ where: { id: registrationId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting tournament registration:", err)
    return NextResponse.json({ success: false, error: "Error al eliminar inscripcion" }, { status: 500 })
  }
}
