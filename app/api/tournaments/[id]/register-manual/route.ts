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

    const { tournamentModalityId, player1, player2, paymentStatus: reqPaymentStatus } = parsed.data

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

    // Ejecutar en paralelo: conteo + resolución de ambos jugadores (caso típico: por ID)
    const resolveP1 = isPlayerById(player1)
      ? prisma.player.findUnique({ where: { id: player1.playerId }, select: { id: true } })
      : findPlayerByPhone(player1.phone).then((ex) =>
          ex ? Promise.resolve(ex.id) : findOrCreatePlayerByPhone({
            phone: player1.phone,
            firstName: player1.firstName,
            lastName: player1.lastName,
            email: player1.email || undefined,
            sourceClubId: tournament.clubId,
          })
        )
    const resolveP2 = isPlayerById(player2)
      ? prisma.player.findUnique({ where: { id: player2.playerId }, select: { id: true } })
      : findPlayerByPhone(player2.phone).then((ex) =>
          ex ? Promise.resolve(ex.id) : findOrCreatePlayerByPhone({
            phone: player2.phone,
            firstName: player2.firstName,
            lastName: player2.lastName,
            email: player2.email || undefined,
            sourceClubId: tournament.clubId,
          })
        )

    const [regCount, p1Res, p2Res] = await Promise.all([
      prisma.tournamentRegistration.count({ where: { tournamentModalityId } }),
      resolveP1,
      resolveP2,
    ])

    const maxAllowed = modality.maxPairs ?? tournament.maxTeams
    if (regCount >= maxAllowed) {
      return NextResponse.json(
        { success: false, error: "Esta categoría está llena" },
        { status: 400 }
      )
    }

    const player1Id = isPlayerById(player1) ? (p1Res as { id: string } | null)?.id : (p1Res as string | null)
    const player2Id = isPlayerById(player2) ? (p2Res as { id: string } | null)?.id : (p2Res as string | null)

    if (!player1Id) {
      return NextResponse.json(
        { success: false, error: isPlayerById(player1) ? "Jugador 1 no encontrado" : "No se pudo crear o encontrar jugador 1 (teléfono inválido)" },
        { status: 400 }
      )
    }
    if (!player2Id) {
      return NextResponse.json(
        { success: false, error: isPlayerById(player2) ? "Jugador 2 no encontrado" : "No se pudo crear o encontrar jugador 2 (teléfono inválido)" },
        { status: 400 }
      )
    }

    if (player1Id === player2Id) {
      return NextResponse.json(
        { success: false, error: "Los dos jugadores deben ser diferentes" },
        { status: 400 }
      )
    }

    // Una sola consulta: pareja duplicada o jugador ya inscrito en la categoría
    const conflicting = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentModalityId,
        OR: [
          { player1Id, player2Id },
          { player1Id: player2Id, player2Id: player1Id },
          { player1Id },
          { player2Id: player1Id },
          { player1Id: player2Id },
          { player2Id },
        ],
      },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
    })
    if (conflicting) {
      const samePair =
        (conflicting.player1Id === player1Id && conflicting.player2Id === player2Id) ||
        (conflicting.player1Id === player2Id && conflicting.player2Id === player1Id)
      if (samePair) {
        return NextResponse.json(
          { success: false, error: "Esta pareja ya esta inscrita en esta modalidad" },
          { status: 409 }
        )
      }
      const dupP1 = conflicting.player1Id === player1Id || conflicting.player1Id === player2Id
      const dupPlayer = dupP1 ? conflicting.player1 : conflicting.player2
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
        paymentStatus: reqPaymentStatus === "PENDING" ? "PENDING" : "CONFIRMED",
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const p1 = registration.player1
    const p2 = registration.player2
    const teamForCache = {
      registrationId: registration.id,
      tournamentModalityId,
      seed: registration.seed,
      player1: `${p1.firstName} ${p1.lastName}`,
      player2: `${p2.firstName} ${p2.lastName}`,
      player1Id: p1.id,
      player2Id: p2.id,
      combinedRanking: 0,
      modality: modality.modality,
      category: modality.category,
      paymentStatus: registration.paymentStatus,
      registeredAt: registration.registeredAt,
    }

    return NextResponse.json(
      {
        success: true,
        data: registration,
        team: teamForCache,
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
