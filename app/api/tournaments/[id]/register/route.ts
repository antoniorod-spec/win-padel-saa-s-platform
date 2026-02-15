import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { registerTeamSchema } from "@/lib/validations/tournament"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["PLAYER"])
    if (error) return error

    const body = await request.json()
    const parsed = registerTeamSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { tournamentModalityId, player1Id, player2Id } = parsed.data

    // Verify tournament exists and is open
    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament || tournament.status !== "OPEN") {
      return NextResponse.json(
        { success: false, error: "Torneo no disponible para inscripcion" },
        { status: 400 }
      )
    }

    // Verify modality belongs to this tournament
    const modality = await prisma.tournamentModality.findUnique({
      where: { id: tournamentModalityId },
      include: { _count: { select: { registrations: true } } },
    })

    if (!modality || modality.tournamentId !== id) {
      return NextResponse.json(
        { success: false, error: "Modalidad invalida para este torneo" },
        { status: 400 }
      )
    }

    // Check max teams
    if (modality._count.registrations >= tournament.maxTeams) {
      return NextResponse.json(
        { success: false, error: "El torneo esta lleno" },
        { status: 400 }
      )
    }

    // Check if team already registered
    const existingReg = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentModalityId,
        OR: [
          { player1Id, player2Id },
          { player1Id: player2Id, player2Id: player1Id },
        ],
      },
    })

    if (existingReg) {
      return NextResponse.json(
        { success: false, error: "Esta pareja ya esta inscrita en esta modalidad" },
        { status: 409 }
      )
    }

    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentModalityId,
        player1Id,
        player2Id,
        paymentAmount: tournament.inscriptionPrice,
        paymentStatus: "PENDING",
      },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: registration,
        message: "Inscripcion exitosa. Pendiente de confirmar pago.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error registering team:", error)
    return NextResponse.json(
      { success: false, error: "Error al inscribir pareja" },
      { status: 500 }
    )
  }
}
