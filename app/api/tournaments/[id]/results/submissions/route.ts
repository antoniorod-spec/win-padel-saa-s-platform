import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(
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
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const submissions = await prisma.tournamentResultSubmission.findMany({
      where: { tournamentId: id },
      include: {
        rows: true,
        validatedByAssociation: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: submissions })
  } catch (err) {
    console.error("Error fetching tournament result submissions:", err)
    return NextResponse.json({ success: false, error: "Error al obtener envios de resultados" }, { status: 500 })
  }
}
