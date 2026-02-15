import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const clubId = searchParams.get("clubId")

    const where: Record<string, unknown> = {}

    if (status) {
      where.paymentStatus = status
    }

    // If club role, only show payments for their tournaments
    if (session!.user.role === "CLUB") {
      const club = await prisma.club.findUnique({
        where: { userId: session!.user.id },
      })
      if (club) {
        where.tournamentModality = { tournament: { clubId: club.id } }
      }
    } else if (clubId) {
      where.tournamentModality = { tournament: { clubId } }
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where,
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
        tournamentModality: {
          include: {
            tournament: { select: { name: true, clubId: true } },
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: registrations.map((r) => ({
        id: r.id,
        player: `${r.player1.firstName} ${r.player1.lastName} / ${r.player2.firstName} ${r.player2.lastName}`,
        tournament: r.tournamentModality.tournament.name,
        amount: Number(r.paymentAmount),
        status: r.paymentStatus,
        registeredAt: r.registeredAt,
        reference: r.paymentReference,
      })),
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener pagos" },
      { status: 500 }
    )
  }
}
