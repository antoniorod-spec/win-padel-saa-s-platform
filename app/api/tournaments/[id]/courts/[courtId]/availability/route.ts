import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

const availabilityItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  specificDate: z.string().datetime().optional(),
})

const setAvailabilitiesSchema = z.object({
  availabilities: z.array(availabilityItemSchema).min(1),
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const authz = await assertTournamentOwner(id, session!.user.id, session!.user.role)
    if (!authz.ok) return authz.response

    const court = await prisma.court.findUnique({ where: { id: courtId } })
    if (!court || court.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Cancha no encontrada" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = setAvailabilitiesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.courtAvailability.deleteMany({ where: { courtId } })
      await tx.courtAvailability.createMany({
        data: parsed.data.availabilities.map((a) => ({
          courtId,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          specificDate: a.specificDate ? new Date(a.specificDate) : undefined,
        })),
      })
    })

    const updated = await prisma.court.findUnique({
      where: { id: courtId },
      include: { availabilities: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error("Error setting court availability:", err)
    return NextResponse.json({ success: false, error: "Error al guardar horarios" }, { status: 500 })
  }
}

