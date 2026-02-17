import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  registrationId: z.string().cuid(),
  fromGroupId: z.string().cuid(),
  toGroupId: z.string().cuid(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; modId: string }> }
) {
  try {
    const { id, modId } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const modality = await prisma.tournamentModality.findUnique({
      where: { id: modId },
      include: { tournament: { include: { club: true } } },
    })
    if (!modality || modality.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Modalidad no encontrada" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && modality.tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const { registrationId, fromGroupId, toGroupId } = parsed.data
    const [fromGroup, toGroup] = await Promise.all([
      prisma.tournamentGroup.findUnique({ where: { id: fromGroupId } }),
      prisma.tournamentGroup.findUnique({ where: { id: toGroupId } }),
    ])
    if (!fromGroup || !toGroup || fromGroup.tournamentModalityId !== modId || toGroup.tournamentModalityId !== modId) {
      return NextResponse.json({ success: false, error: "Grupo invalido" }, { status: 400 })
    }

    const toCount = await prisma.groupPlacement.count({ where: { groupId: toGroupId } })
    if (toCount >= toGroup.groupSize) {
      return NextResponse.json({ success: false, error: "El grupo destino ya esta lleno" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupPlacement.deleteMany({
        where: { groupId: fromGroupId, registrationId },
      })
      await tx.groupPlacement.create({
        data: { groupId: toGroupId, registrationId },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error swapping group placement:", err)
    return NextResponse.json({ success: false, error: "Error al mover pareja" }, { status: 500 })
  }
}

