import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { createTournamentSchema } from "@/lib/validations/tournament"
import { buildCityKey, buildStateKey } from "@/lib/location/keys"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category") // tournament.category (A/B/C)
    const modality = searchParams.get("modality")
    const city = searchParams.get("city")
    const state = searchParams.get("state")
    const cityKey = searchParams.get("cityKey")
    const stateKey = searchParams.get("stateKey")
    const clubId = searchParams.get("clubId")
    const format = searchParams.get("format")
    const type = searchParams.get("type")
    const tournamentClass = searchParams.get("tournamentClass") // MAJOR | REGULAR | EXPRESS
    const modalityCategoriesRaw = searchParams.get("modalityCategories")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
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
    if (clubId) where.clubId = clubId
    if (type) where.type = type
    if (format) where.format = format
    if (tournamentClass) {
      const tc = tournamentClass.trim().toUpperCase()
      if (tc === "EXPRESS") {
        where.format = "EXPRESS"
      } else if (tc === "MAJOR") {
        // Pragmatic mapping without DB change:
        // Major = category A
        where.category = "A"
      } else if (tc === "REGULAR") {
        // Regular = category B/C (exclude A); keep it simple.
        where.category = { in: ["B", "C"] }
      }
    }
    if (city || state) {
      where.club = {
        is: {
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
        },
      }
    }
    if (search) where.name = { contains: search, mode: "insensitive" }
    if (modality) {
      where.modalities = { some: { modality } }
    }
    if (modalityCategoriesRaw) {
      const categoriesList = modalityCategoriesRaw
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
      if (categoriesList.length > 0) {
        where.modalities = {
          some: {
            ...(modality ? { modality } : {}),
            category: categoriesList.length > 1 ? { in: categoriesList } : categoriesList[0],
          },
        }
      }
    }
    if (from || to) {
      const fromDate = from ? new Date(from) : null
      const toDate = to ? new Date(to) : null
      if (fromDate && Number.isNaN(fromDate.getTime())) {
        return NextResponse.json({ success: false, error: "Parametro 'from' invalido" }, { status: 400 })
      }
      if (toDate && Number.isNaN(toDate.getTime())) {
        return NextResponse.json({ success: false, error: "Parametro 'to' invalido" }, { status: 400 })
      }
      // Overlap logic: tournament intersects [from,to]
      if (fromDate && toDate) {
        where.AND = [{ startDate: { lte: toDate } }, { endDate: { gte: fromDate } }]
      } else if (fromDate) {
        where.endDate = { gte: fromDate }
      } else if (toDate) {
        where.startDate = { lte: toDate }
      }
    }

    if (mine) {
      const { session, error } = await requireAuth(["CLUB", "ADMIN"])
      if (error) return error
      if (session?.user.role === "CLUB") {
        where.club = { is: { userId: session.user.id } }
      }
    }

    const shouldFilterByKeys = Boolean(cityKey || stateKey)

    const desiredCityKey = cityKey?.trim() || null
    const desiredStateKey = stateKey?.trim() || null

    const selectQuery = {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      category: true,
      format: true,
      prize: true,
      sponsorName: true,
      sponsorLogoUrl: true,
      logoUrl: true,
      inscriptionPrice: true,
      type: true,
      externalRegistrationType: true,
      externalRegistrationLink: true,
      registrationDeadline: true,
      posterUrl: true,
      resultsValidationStatus: true,
      maxTeams: true,
      status: true,
      clubId: true,
      club: { select: { name: true, city: true, state: true, country: true, logoUrl: true } },
      modalities: {
        select: {
          modality: true,
          category: true,
          _count: { select: { registrations: true } },
        },
      },
    } as const

    if (shouldFilterByKeys) {
      // Key filtering cannot be expressed in Prisma without storing the keys in DB,
      // so we fetch the filtered set and apply normalized key matching in-memory.
      const all = await prisma.tournament.findMany({
        where,
        select: selectQuery,
        orderBy: { startDate: "asc" },
        take: 2000,
      })

      const filtered = all.filter((t) => {
        const country = t.club.country || "MX"
        const st = t.club.state || ""
        const ct = t.club.city || ""
        const stKey = buildStateKey(country, st)
        const ctKey = buildCityKey(country, st, ct)
        if (desiredStateKey && stKey !== desiredStateKey) return false
        if (desiredCityKey && ctKey !== desiredCityKey) return false
        return true
      })

      const total = filtered.length
      const start = (page - 1) * pageSize
      const pageItems = filtered.slice(start, start + pageSize)

      return NextResponse.json({
        success: true,
        data: {
          items: pageItems.map((t) => ({
            id: t.id,
            name: t.name,
            clubId: t.clubId,
            clubName: t.club.name,
            city: t.club.city,
            state: t.club.state,
            country: t.club.country,
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
            clubLogoUrl: t.club.logoUrl,
            resultsValidationStatus: t.resultsValidationStatus,
            maxTeams: t.maxTeams,
            status: t.status,
            modalities: t.modalities.map((m) => `${m.modality} ${m.category}`),
            registeredTeams: t.modalities.reduce((sum, m) => sum + m._count.registrations, 0),
          })),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      })
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        select: selectQuery,
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
          clubId: t.clubId,
          clubName: t.club.name,
          city: t.club.city,
          state: t.club.state,
          country: t.club.country,
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
          clubLogoUrl: t.club.logoUrl,
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
        registrationOpensAt: tournamentData.registrationOpensAt ? new Date(tournamentData.registrationOpensAt) : undefined,
        officialBall: tournamentData.officialBall ?? undefined,
        supportWhatsApp: tournamentData.supportWhatsApp ?? undefined,
        prize: tournamentData.prize,
        sponsorName: tournamentData.sponsorName || undefined,
        sponsorLogoUrl: tournamentData.sponsorLogoUrl || undefined,
        logoUrl: tournamentData.logoUrl || undefined,
        posterUrl: tournamentData.posterUrl || undefined,
        rulesPdfUrl: tournamentData.rulesPdfUrl || undefined,
        externalRegistrationType: tournamentData.externalRegistrationType || undefined,
        externalRegistrationLink: tournamentData.externalRegistrationLink || undefined,
        affectsRanking:
          typeof tournamentData.affectsRanking === "boolean"
            ? tournamentData.affectsRanking
            : tournamentData.category === "D"
              ? false
              : tournamentData.type === "BASIC"
                ? false
                : true,
        resultsValidationStatus: tournamentData.type === "BASIC" ? "PENDING_REVIEW" : "NOT_REQUIRED",
        venue: tournamentData.venue || undefined,
        images: tournamentData.images ?? undefined,
        news: tournamentData.news ?? undefined,
        inscriptionPrice: tournamentData.inscriptionPrice ?? 0,
        maxTeams: tournamentData.maxTeams ?? 64,
        matchDurationMinutes: tournamentData.matchDurationMinutes ?? 70,
        minPairsPerModality: tournamentData.minPairsPerModality ?? 6,
        rules: tournamentData.rules ?? undefined,
        // Wizard flow: FULL tournaments start as DRAFT, then transition to OPEN when ready.
        // BASIC tournaments are simple announcements and keep legacy behavior (OPEN immediately).
        status: tournamentData.type === "BASIC" ? "OPEN" : "DRAFT",
        modalities: modalities && modalities.length > 0
          ? {
              create: modalities.map((m) => ({
                modality: m.modality,
                category: m.category,
                prizeType: m.prizeType ?? undefined,
                prizeAmount: m.prizeAmount ?? undefined,
                prizeDescription: m.prizeDescription ?? undefined,
                minPairs: m.minPairs ?? undefined,
                maxPairs: m.maxPairs ?? undefined,
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
