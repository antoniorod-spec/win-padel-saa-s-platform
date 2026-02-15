import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const data = await prisma.tournamentResultSubmission.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            club: { select: { city: true } },
          },
        },
        rows: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("Error fetching pending result submissions:", err)
    return NextResponse.json({ success: false, error: "Error al obtener pendientes" }, { status: 500 })
  }
}
