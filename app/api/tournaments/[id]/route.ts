import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { updateTournamentSchema } from "@/lib/validations/tournament"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true, city: true, courts: true, logoUrl: true } },
        modalities: {
          include: {
            _count: { select: { registrations: true } },
            registrations: {
              include: {
                player1: { select: { id: true, firstName: true, lastName: true } },
                player2: { select: { id: true, firstName: true, lastName: true } },
              },
              orderBy: { seed: "asc" },
            },
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneo no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        clubId: tournament.club.id,
        clubName: tournament.club.name,
        city: tournament.club.city,
        courts: tournament.club.courts,
        clubLogoUrl: tournament.club.logoUrl,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        category: tournament.category,
        format: tournament.format,
        type: tournament.type,
        venue: tournament.venue,
        registrationDeadline: tournament.registrationDeadline,
        registrationOpensAt: tournament.registrationOpensAt,
        officialBall: tournament.officialBall,
        supportWhatsApp: tournament.supportWhatsApp,
        externalRegistrationType: tournament.externalRegistrationType,
        externalRegistrationLink: tournament.externalRegistrationLink,
        posterUrl: tournament.posterUrl,
        rulesPdfUrl: tournament.rulesPdfUrl,
        affectsRanking: tournament.affectsRanking,
        resultsValidationStatus: tournament.resultsValidationStatus,
        validationNotes: tournament.validationNotes,
        prize: tournament.prize,
        sponsorName: tournament.sponsorName,
        sponsorLogoUrl: tournament.sponsorLogoUrl,
        logoUrl: tournament.logoUrl,
        images: tournament.images,
        news: tournament.news,
        inscriptionPrice: Number(tournament.inscriptionPrice),
        maxTeams: tournament.maxTeams,
        matchDurationMinutes: tournament.matchDurationMinutes,
        minPairsPerModality: tournament.minPairsPerModality,
        rules: tournament.rules,
        status: tournament.status,
        modalities: tournament.modalities.map((m) => ({
          id: m.id,
          modality: m.modality,
          category: m.category,
          prizeType: m.prizeType,
          prizeAmount: m.prizeAmount != null ? Number(m.prizeAmount) : null,
          prizeDescription: m.prizeDescription,
          minPairs: m.minPairs,
          maxPairs: m.maxPairs,
          registeredTeams: m._count.registrations,
          teams: m.registrations.map((r) => ({
            registrationId: r.id,
            seed: r.seed,
            player1: `${r.player1.firstName} ${r.player1.lastName}`,
            player2: `${r.player2.firstName} ${r.player2.lastName}`,
            paymentStatus: r.paymentStatus,
          })),
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener torneo" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneo no encontrado" },
        { status: 404 }
      )
    }

    if (tournament.club.userId !== session!.user.id && session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateTournamentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { modalities: nextModalities, ...data } = parsed.data

    // Allow editing modalities only while DRAFT and before any registrations exist.
    if (nextModalities) {
      if (tournament.status !== "DRAFT") {
        return NextResponse.json(
          { success: false, error: "Solo se pueden editar categorias en estado borrador" },
          { status: 400 }
        )
      }

      const regCount = await prisma.tournamentRegistration.count({
        where: { tournamentModality: { tournamentId: id } },
      })
      if (regCount > 0) {
        return NextResponse.json(
          { success: false, error: "No se pueden editar categorias con parejas registradas" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.tournament.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
          registrationOpensAt: data.registrationOpensAt ? new Date(data.registrationOpensAt) : data.registrationOpensAt === null ? null : undefined,
        },
      })

      if (nextModalities) {
        await tx.tournamentModality.deleteMany({ where: { tournamentId: id } })
        if (nextModalities.length > 0) {
          await tx.tournamentModality.createMany({
            data: nextModalities.map((m) => ({
              tournamentId: id,
              modality: m.modality,
              category: m.category,
              prizeType: m.prizeType ?? undefined,
              prizeAmount: m.prizeAmount ?? undefined,
              prizeDescription: m.prizeDescription ?? undefined,
              minPairs: m.minPairs ?? undefined,
              maxPairs: m.maxPairs ?? undefined,
            })),
          })
        }
      }

      return t
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar torneo" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
      return NextResponse.json(
        { success: false, error: "Torneo no encontrado" },
        { status: 404 }
      )
    }

    if (tournament.club.userId !== session!.user.id && session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    // Permitir eliminar: DRAFT siempre, o OPEN/otros si no hay parejas registradas (creado por error)
    const regCount = await prisma.tournamentRegistration.count({
      where: { tournamentModality: { tournamentId: id } },
    })
    const canDelete =
      tournament.status === "DRAFT" || (regCount === 0 && ["OPEN", "CLOSED", "GENERATED"].includes(tournament.status))
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Solo se pueden eliminar torneos en borrador o sin parejas registradas" },
        { status: 400 }
      )
    }

    await prisma.tournament.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Torneo eliminado" })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json(
      { success: false, error: "Error al eliminar torneo" },
      { status: 500 }
    )
  }
}
