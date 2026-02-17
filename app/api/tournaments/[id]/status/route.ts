import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { transitionTournament } from "@/lib/tournament/state-machine"
import { TournamentStatus } from "@prisma/client"

const schema = z.object({
  status: z.nativeEnum(TournamentStatus),
})

export async function PATCH(
  request: NextRequest,
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

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const result = await transitionTournament(id, parsed.data.status)
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Transicion invalida", details: result.errors }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: result.tournament })
  } catch (err) {
    console.error("Error transitioning tournament:", err)
    return NextResponse.json({ success: false, error: "Error al cambiar estado" }, { status: 500 })
  }
}

