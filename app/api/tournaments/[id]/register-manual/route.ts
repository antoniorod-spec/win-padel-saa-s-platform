import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { registerManualSchema } from "@/lib/validations/tournament"
import { findOrCreatePlayerByPhone, findPlayerByPhone } from "@/lib/services/imported-roster-service"

function isPlayerById(
  p: { playerId?: string; phone?: string; firstName?: string; lastName?: string }
): p is { playerId: string } {
  return "playerId" in p && typeof p.playerId === "string"
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json()
    const parsed = registerManualSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { tournamentModalityId, player1, player2 } = parsed.data

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { club: true, modalities: true },
    })
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    if (tournament.status !== "DRAFT" && tournament.status !== "OPEN") {
      return NextResponse.json(
        { success: false, error: "El torneo no acepta inscripciones en este estado" },
        { status: 400 }
      )
    }

    const modality = tournament.modalities.find((m) => m.id === tournamentModalityId)
    if (!modality || modality.tournamentId !== id) {
      return NextResponse.json(
        { success: false, error: "Modalidad invalida para este torneo" },
        { status: 400 }
      )
    }

    const regCount = await prisma.tournamentRegistration.count({
      where: { tournamentModalityId },
    })
    const maxAllowed = modality.maxPairs ?? tournament.maxTeams
    if (regCount >= maxAllowed) {
      return NextResponse.json(
        { success: false, error: "Esta categoría está llena" },
        { status: 400 }
      )
    }

    let player1Id: string
    let player2Id: string

    if (isPlayerById(player1)) {
      const p1 = await prisma.player.findUnique({ where: { id: player1.playerId } })
      if (!p1) {
        return NextResponse.json({ success: false, error: "Jugador 1 no encontrado" }, { status: 400 })
      }
      player1Id = p1.id
    } else {
      const existing = await findPlayerByPhone(player1.phone)
      if (existing) {
        player1Id = existing.id
      } else {
        const created = await findOrCreatePlayerByPhone({
          phone: player1.phone,
          firstName: player1.firstName,
          lastName: player1.lastName,
          email: player1.email || undefined,
          sourceClubId: tournament.clubId,
        })
        if (!created) {
          return NextResponse.json(
            { success: false, error: "No se pudo crear o encontrar jugador 1 (teléfono inválido)" },
            { status: 400 }
          )
        }
        player1Id = created
      }
    }

    if (isPlayerById(player2)) {
      const p2 = await prisma.player.findUnique({ where: { id: player2.playerId } })
      if (!p2) {
        return NextResponse.json({ success: false, error: "Jugador 2 no encontrado" }, { status: 400 })
      }
      player2Id = p2.id
    } else {
      const existing = await findPlayerByPhone(player2.phone)
      if (existing) {
        player2Id = existing.id
      } else {
        const created = await findOrCreatePlayerByPhone({
          phone: player2.phone,
          firstName: player2.firstName,
          lastName: player2.lastName,
          email: player2.email || undefined,
          sourceClubId: tournament.clubId,
        })
        if (!created) {
          return NextResponse.json(
            { success: false, error: "No se pudo crear o encontrar jugador 2 (teléfono inválido)" },
            { status: 400 }
          )
        }
        player2Id = created
      }
    }

    if (player1Id === player2Id) {
      return NextResponse.json(
        { success: false, error: "Los dos jugadores deben ser diferentes" },
        { status: 400 }
      )
    }

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
        paymentStatus: "CONFIRMED",
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: registration,
        message: "Pareja inscrita correctamente.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error registering team manually:", error)
    return NextResponse.json(
      { success: false, error: "Error al inscribir pareja" },
      { status: 500 }
    )
  }
}
