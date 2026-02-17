import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

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
    const date = searchParams.get("date") // YYYY-MM-DD
    const courtId = searchParams.get("courtId")
    const status = searchParams.get("status")

    const where: any = { court: { tournamentId: id } }
    if (courtId) where.courtId = courtId
    if (status) where.status = status
    if (date) {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ success: false, error: "Parametro date invalido" }, { status: 400 })
      }
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      where.date = { gte: start, lt: end }
    }

    const slots = await prisma.matchSlot.findMany({
      where,
      include: { court: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5000,
    })

    return NextResponse.json({ success: true, data: slots })
  } catch (err) {
    console.error("Error listing slots:", err)
    return NextResponse.json({ success: false, error: "Error al obtener slots" }, { status: 500 })
  }
}

