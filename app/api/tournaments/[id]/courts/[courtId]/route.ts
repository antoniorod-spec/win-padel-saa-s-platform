import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

const updateCourtSchema = z.object({
  name: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  isIndoor: z.boolean().optional(),
})

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const authz = await assertTournamentOwner(id, session!.user.id, session!.user.role)
    if (!authz.ok) return authz.response

    const existing = await prisma.court.findUnique({ where: { id: courtId } })
    if (!existing || existing.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Cancha no encontrada" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateCourtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const court = await prisma.court.update({
      where: { id: courtId },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, data: court })
  } catch (err) {
    console.error("Error updating tournament court:", err)
    return NextResponse.json({ success: false, error: "Error al actualizar cancha" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const authz = await assertTournamentOwner(id, session!.user.id, session!.user.role)
    if (!authz.ok) return authz.response

    const existing = await prisma.court.findUnique({ where: { id: courtId } })
    if (!existing || existing.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Cancha no encontrada" }, { status: 404 })
    }

    await prisma.court.delete({ where: { id: courtId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting tournament court:", err)
    return NextResponse.json({ success: false, error: "Error al eliminar cancha" }, { status: 500 })
  }
}

