import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

const patchSchema = z.object({
  status: z.enum(["BLOCKED", "AVAILABLE"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const { id, slotId } = await params
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
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const slot = await prisma.matchSlot.findUnique({ where: { id: slotId }, include: { court: true } })
    if (!slot || slot.court.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Slot no encontrado" }, { status: 404 })
    }

    if (slot.status === "ASSIGNED" || slot.status === "RESERVED") {
      return NextResponse.json({ success: false, error: "No se puede modificar un slot asignado o reservado" }, { status: 400 })
    }

    const updated = await prisma.matchSlot.update({
      where: { id: slotId },
      data: { status: parsed.data.status },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error("Error patching slot:", err)
    return NextResponse.json({ success: false, error: "Error al actualizar slot" }, { status: 500 })
  }
}

