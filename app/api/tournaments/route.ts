import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { createTournamentSchema } from "@/lib/validations/tournament"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const modality = searchParams.get("modality")
    const city = searchParams.get("city")
    const search = searchParams.get("search")
    const mine = searchParams.get("mine") === "true"
    const page = parseInt(searchParams.get("page") ?? "1")
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20")

    const where: Record<string, unknown> = {}
    if (status) {
      const requestedStatuses = status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s === "UPCOMING" ? "OPEN" : s))

      where.status =
        requestedStatuses.length > 1
          ? { in: requestedStatuses }
          : requestedStatuses[0]
    }
    if (category) where.category = category
    if (city) where.club = { is: { city } }
    if (search) where.name = { contains: search, mode: "insensitive" }
    if (modality) {
      where.modalities = { some: { modality } }
    }

    if (mine) {
      const { session, error } = await requireAuth(["CLUB", "ADMIN"])
      if (error) return error
      if (session?.user.role === "CLUB") {
        where.club = { is: { userId: session.user.id } }
      }
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          club: { select: { name: true, city: true } },
          modalities: {
            include: { _count: { select: { registrations: true } } },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startDate: "asc" },
      }),
      prisma.tournament.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: tournaments.map((t) => ({
          id: t.id,
          name: t.name,
          clubName: t.club.name,
          city: t.club.city,
          startDate: t.startDate,
          endDate: t.endDate,
          category: t.category,
          format: t.format,
          prize: t.prize,
          sponsorName: t.sponsorName,
          sponsorLogoUrl: t.sponsorLogoUrl,
          logoUrl: t.logoUrl,
          inscriptionPrice: Number(t.inscriptionPrice),
          type: t.type,
          externalRegistrationType: t.externalRegistrationType,
          externalRegistrationLink: t.externalRegistrationLink,
          registrationDeadline: t.registrationDeadline,
          posterUrl: t.posterUrl,
          resultsValidationStatus: t.resultsValidationStatus,
          maxTeams: t.maxTeams,
          status: t.status,
          modalities: t.modalities.map((m) => `${m.modality} ${m.category}`),
          registeredTeams: t.modalities.reduce(
            (sum, m) => sum + m._count.registrations, 0
          ),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener torneos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json()
    const parsed = createTournamentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Get the club for this user
    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
    })

    if (!club) {
      return NextResponse.json(
        { success: false, error: "No se encontro el club asociado a esta cuenta" },
        { status: 404 }
      )
    }

    if (club.status !== "APPROVED") {
      return NextResponse.json(
        { success: false, error: "El club debe estar aprobado para crear torneos" },
        { status: 403 }
      )
    }

    const { modalities, ...tournamentData } = parsed.data

    const tournament = await prisma.tournament.create({
      data: {
        clubId: club.id,
        name: tournamentData.name,
        description: tournamentData.description,
        startDate: new Date(tournamentData.startDate),
        endDate: new Date(tournamentData.endDate),
        category: tournamentData.category,
        format: tournamentData.format,
        type: tournamentData.type,
        registrationDeadline: tournamentData.registrationDeadline ? new Date(tournamentData.registrationDeadline) : undefined,
        prize: tournamentData.prize,
        sponsorName: tournamentData.sponsorName || undefined,
        sponsorLogoUrl: tournamentData.sponsorLogoUrl || undefined,
        logoUrl: tournamentData.logoUrl || undefined,
        posterUrl: tournamentData.posterUrl || undefined,
        externalRegistrationType: tournamentData.externalRegistrationType || undefined,
        externalRegistrationLink: tournamentData.externalRegistrationLink || undefined,
        affectsRanking:
          typeof tournamentData.affectsRanking === "boolean"
            ? tournamentData.affectsRanking
            : tournamentData.type === "BASIC"
              ? false
              : true,
        resultsValidationStatus: tournamentData.type === "BASIC" ? "PENDING_REVIEW" : "NOT_REQUIRED",
        venue: tournamentData.venue || undefined,
        images: tournamentData.images ?? undefined,
        news: tournamentData.news ?? undefined,
        inscriptionPrice: tournamentData.inscriptionPrice ?? 0,
        maxTeams: tournamentData.maxTeams ?? 64,
        rules: tournamentData.rules ?? undefined,
        status: "OPEN",
        modalities: modalities && modalities.length > 0
          ? {
              create: modalities.map((m) => ({
                modality: m.modality,
                category: m.category,
              })),
            }
          : undefined,
      },
      include: { modalities: true },
    })

    return NextResponse.json(
      { success: true, data: tournament },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json(
      { success: false, error: "Error al crear torneo" },
      { status: 500 }
    )
  }
}
