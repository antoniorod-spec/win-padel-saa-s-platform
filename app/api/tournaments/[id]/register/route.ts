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

    // Check max teams (per modality if set, else tournament global)
    const maxAllowed = modality.maxPairs ?? tournament.maxTeams
    if (modality._count.registrations >= maxAllowed) {
      return NextResponse.json(
        { success: false, error: "Esta categoría está llena" },
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

    // Check if either player is already registered in this category with a different partner
    const playerAlreadyInCategory = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentModalityId,
        OR: [{ player1Id }, { player2Id }],
      },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
    })
    if (playerAlreadyInCategory) {
      const isP1Dup =
        playerAlreadyInCategory.player1Id === player1Id || playerAlreadyInCategory.player1Id === player2Id
      const dupPlayer = isP1Dup ? playerAlreadyInCategory.player1 : playerAlreadyInCategory.player2
      return NextResponse.json(
        {
          success: false,
          error: `${dupPlayer.firstName} ${dupPlayer.lastName} ya está inscrito en esta categoría con otra pareja. Un jugador solo puede tener una pareja por categoría.`,
        },
        { status: 400 }
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
