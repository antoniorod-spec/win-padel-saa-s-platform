import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const courtId = searchParams.get("courtId")
    const modalityId = searchParams.get("modalityId")

    const where: any = {
      tournamentModality: { tournamentId: id },
      slotId: { not: null },
    }
    if (modalityId) where.tournamentModalityId = modalityId
    if (courtId) where.slot = { is: { courtId } }
    if (date) {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ success: false, error: "Parametro date invalido" }, { status: 400 })
      }
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      where.slot = { ...(where.slot ?? {}), is: { ...(where.slot?.is ?? {}), date: { gte: start, lt: end } } }
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        slot: { include: { court: true } },
        tournamentModality: { select: { id: true, modality: true, category: true } },
        teamARegistration: {
          include: { player1: { select: { firstName: true, lastName: true } }, player2: { select: { firstName: true, lastName: true } } },
        },
        teamBRegistration: {
          include: { player1: { select: { firstName: true, lastName: true } }, player2: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: [{ slot: { date: "asc" } }, { slot: { startTime: "asc" } }],
      take: 5000,
    })

    return NextResponse.json({ success: true, data: matches })
  } catch (err) {
    console.error("Error fetching schedule:", err)
    return NextResponse.json({ success: false, error: "Error al obtener calendario" }, { status: 500 })
  }
}

