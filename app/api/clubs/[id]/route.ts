import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { updateClubSchema } from "@/lib/validations/club"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        _count: { select: { tournaments: true, homePlayers: true } },
        news: {
          where: { published: true },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 10,
        },
      },
    })

    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const [pastTournaments, currentTournaments, upcomingTournaments, homePlayers] = await Promise.all([
      prisma.tournament.findMany({
        where: { clubId: id, status: "COMPLETED" },
        orderBy: { startDate: "desc" },
        include: { modalities: true },
      }),
      prisma.tournament.findMany({
        where: { clubId: id, status: "IN_PROGRESS" },
        orderBy: { startDate: "asc" },
        include: { modalities: true },
      }),
      prisma.tournament.findMany({
        where: { clubId: id, status: { in: ["OPEN", "DRAFT"] } },
        orderBy: { startDate: "asc" },
        include: { modalities: true },
      }),
      prisma.player.findMany({
        where: { homeClubId: id },
        include: {
          user: { select: { image: true } },
          rankings: {
            where: { scope: "NATIONAL" },
            orderBy: { points: "desc" },
          },
        },
      }),
    ])

    const playersRanking = homePlayers
      .map((player) => {
        const topRanking = player.rankings[0] || null
        return {
          id: player.id,
          fullName: `${player.firstName} ${player.lastName}`,
          city: player.city,
          avatarUrl: player.user.image,
          points: topRanking?.points ?? 0,
          played: topRanking?.played ?? 0,
          wins: topRanking?.wins ?? 0,
          losses: topRanking?.losses ?? 0,
          modality: topRanking?.modality ?? null,
          category: topRanking?.category ?? null,
        }
      })
      .sort((a, b) => b.points - a.points)

    return NextResponse.json({
      success: true,
      data: {
        id: club.id,
        name: club.name,
        description: club.description,
        legalName: club.legalName,
        city: club.city,
        state: club.state,
        country: club.country,
        address: club.address,
        postalCode: club.postalCode,
        neighborhood: club.neighborhood,
        latitude: club.latitude,
        longitude: club.longitude,
        phone: club.phone,
        email: club.email,
        website: club.website,
        contactName: club.contactName,
        contactPhone: club.contactPhone,
        contactEmail: club.contactEmail,
        contactPosition: club.contactPosition,
        courts: club.courts,
        indoorCourts: club.indoorCourts,
        outdoorCourts: club.outdoorCourts,
        courtSurface: club.courtSurface,
        courtSurfaces: club.courtSurfaces,
        hasParking: club.hasParking,
        hasLockers: club.hasLockers,
        hasShowers: club.hasShowers,
        hasCafeteria: club.hasCafeteria,
        hasProShop: club.hasProShop,
        hasLighting: club.hasLighting,
        hasAirConditioning: club.hasAirConditioning,
        operatingHours: club.operatingHours,
        weeklySchedule: club.weeklySchedule,
        priceRange: club.priceRange,
        acceptsOnlineBooking: club.acceptsOnlineBooking,
        services: club.services,
        rating: club.rating,
        logoUrl: club.logoUrl,
        photos: club.photos,
        facebook: club.facebook,
        instagram: club.instagram,
        tiktok: club.tiktok,
        youtube: club.youtube,
        linkedin: club.linkedin,
        x: club.x,
        whatsapp: club.whatsapp,
        status: club.status,
        totalTournaments: club._count.tournaments,
        totalHomePlayers: club._count.homePlayers,
        activeTournaments: currentTournaments,
        pastTournaments,
        currentTournaments,
        upcomingTournaments,
        playersRanking,
        news: club.news,
      },
    })
  } catch (error) {
    console.error("Error fetching club:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener club" },
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

    const club = await prisma.club.findUnique({ where: { id } })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    // Only club owner or admin can update
    if (club.userId !== session!.user.id && session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateClubSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = { ...parsed.data } as Record<string, unknown>
    const normalizeEmpty = (value: unknown) =>
      typeof value === "string" && value.trim() === "" ? null : value
    const nullableTextFields = [
      "description",
      "legalName",
      "email",
      "website",
      "contactEmail",
      "contactPosition",
      "postalCode",
      "neighborhood",
      "courtSurface",
      "operatingHours",
      "priceRange",
      "logoUrl",
      "facebook",
      "instagram",
      "tiktok",
      "youtube",
      "linkedin",
      "x",
      "whatsapp",
    ]
    for (const field of nullableTextFields) {
      if (field in payload) payload[field] = normalizeEmpty(payload[field])
    }
    if (Array.isArray(payload.photos) && payload.photos.length === 0) payload.photos = null
    if (Array.isArray(payload.services) && payload.services.length === 0) payload.services = null
    if (Array.isArray(payload.courtSurfaces) && payload.courtSurfaces.length === 0) payload.courtSurfaces = null
    if (Array.isArray(payload.weeklySchedule) && payload.weeklySchedule.length === 0) payload.weeklySchedule = null

    const updated = await prisma.club.update({
      where: { id },
      data: payload,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating club:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar club" },
      { status: 500 }
    )
  }
}
