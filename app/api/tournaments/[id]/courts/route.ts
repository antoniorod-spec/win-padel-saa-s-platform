import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

const createCourtSchema = z.object({
  name: z.string().min(1),
  venue: z.string().min(1),
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
  return { ok: true as const, tournament: t }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const authz = await assertTournamentOwner(id, session!.user.id, session!.user.role)
    if (!authz.ok) return authz.response

    const courts = await prisma.court.findMany({
      where: { tournamentId: id },
      include: {
        availabilities: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        _count: { select: { slots: true } },
      },
      orderBy: [{ venue: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ success: true, data: courts })
  } catch (err) {
    console.error("Error fetching tournament courts:", err)
    return NextResponse.json({ success: false, error: "Error al obtener canchas" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const authz = await assertTournamentOwner(id, session!.user.id, session!.user.role)
    if (!authz.ok) return authz.response

    const body = await request.json()
    const parsed = createCourtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const court = await prisma.court.create({
      data: {
        tournamentId: id,
        name: parsed.data.name,
        venue: parsed.data.venue,
        isIndoor: Boolean(parsed.data.isIndoor),
      },
    })

    return NextResponse.json({ success: true, data: court }, { status: 201 })
  } catch (err) {
    console.error("Error creating tournament court:", err)
    return NextResponse.json({ success: false, error: "Error al crear cancha" }, { status: 500 })
  }
}

