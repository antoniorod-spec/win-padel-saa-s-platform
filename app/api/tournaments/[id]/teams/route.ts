import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const modalityId = searchParams.get("modalityId")

    const where: Record<string, unknown> = {
      tournamentModality: { tournamentId: id },
    }
    if (modalityId) {
      where.tournamentModalityId = modalityId
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where,
      include: {
        player1: {
          include: { rankings: true },
        },
        player2: {
          include: { rankings: true },
        },
        tournamentModality: {
          select: { id: true, modality: true, category: true },
        },
      },
      orderBy: { seed: "asc" },
    })

    return NextResponse.json({
      success: true,
      data: registrations.map((r) => {
        // Calculate combined ranking points
        const p1Ranking = r.player1.rankings?.[0]?.points ?? 0
        const p2Ranking = r.player2.rankings?.[0]?.points ?? 0

        return {
          registrationId: r.id,
          tournamentModalityId: r.tournamentModality.id,
          seed: r.seed,
          player1: `${r.player1.firstName} ${r.player1.lastName}`,
          player2: `${r.player2.firstName} ${r.player2.lastName}`,
          player1Id: r.player1.id,
          player2Id: r.player2.id,
          combinedRanking: p1Ranking + p2Ranking,
          modality: r.tournamentModality.modality,
          category: r.tournamentModality.category,
          paymentStatus: r.paymentStatus,
          registeredAt: r.registeredAt,
        }
      }),
    })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener parejas" },
      { status: 500 }
    )
  }
}
