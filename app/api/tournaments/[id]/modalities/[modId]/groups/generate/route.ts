import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { generateGroups } from "@/lib/tournament/generate-groups"

export async function POST(
  _request: NextRequest,
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

    const result = await generateGroups(modId)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error("Error generating groups:", err)
    const message = err instanceof Error ? err.message : "Error al generar grupos"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

