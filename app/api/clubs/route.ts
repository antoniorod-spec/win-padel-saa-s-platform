import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildCityKey, buildStateKey, normalizeLocationToken } from "@/lib/location/keys"

const ALLOWED_SORTS = new Set(["rating_desc", "rating_asc", "name_asc", "name_desc", "courts_desc"])
const ALLOWED_AMENITIES = new Set([
  "hasParking",
  "hasLockers",
  "hasShowers",
  "hasCafeteria",
  "hasProShop",
  "hasLighting",
  "hasAirConditioning",
  "acceptsOnlineBooking",
])

function normalizeCsv(value: string | null) {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeSurfaceList(club: { courtSurface: string | null; courtSurfaces: unknown }): string[] {
  const fromJson = Array.isArray(club.courtSurfaces)
    ? club.courtSurfaces.filter((value): value is string => typeof value === "string" && value.trim() !== "")
    : []
  const merged = [...fromJson]
  if (club.courtSurface && !merged.includes(club.courtSurface)) {
    merged.push(club.courtSurface)
  }
  return merged
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stateKey = searchParams.get("stateKey")
    const cityKey = searchParams.get("cityKey")
    const legacyCity = searchParams.get("city")
    const legacyState = searchParams.get("state")
    const status = searchParams.get("status") ?? "APPROVED"
    const search = searchParams.get("search")
    const surfaces = normalizeCsv(searchParams.get("surfaces"))
    const amenities = normalizeCsv(searchParams.get("amenities")).filter((key) => ALLOWED_AMENITIES.has(key))
    const sort = searchParams.get("sort") ?? "rating_desc"
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") ?? "8", 10) || 8, 1), 48)

    const where: Record<string, unknown> = { status }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ]
    }
    for (const amenity of amenities) {
      where[amenity] = true
    }

    const clubsRaw = await prisma.club.findMany({
      where,
      include: {
        _count: {
          select: { tournaments: true },
        },
      },
    })

    const desiredStateKey =
      typeof stateKey === "string" && stateKey.trim()
        ? stateKey.trim()
        : typeof legacyState === "string" && legacyState.trim()
          ? `legacy:${normalizeLocationToken(legacyState)}`
          : null
    const desiredCityKey =
      typeof cityKey === "string" && cityKey.trim()
        ? cityKey.trim()
        : typeof legacyCity === "string" && legacyCity.trim()
          ? `legacy:${normalizeLocationToken(legacyCity)}`
          : null

    const filteredByLocation =
      desiredStateKey || desiredCityKey
        ? clubsRaw.filter((club) => {
            const clubCountry = club.country || "XX"
            const clubStateKey = buildStateKey(clubCountry, club.state)
            const clubCityKey = buildCityKey(clubCountry, club.state, club.city)

            const matchesState = desiredStateKey
              ? desiredStateKey.startsWith("legacy:")
                ? normalizeLocationToken(club.state) === desiredStateKey.replace(/^legacy:/, "")
                : clubStateKey === desiredStateKey
              : true

            const matchesCity = desiredCityKey
              ? desiredCityKey.startsWith("legacy:")
                ? normalizeLocationToken(club.city) === desiredCityKey.replace(/^legacy:/, "")
                : clubCityKey === desiredCityKey
              : true

            return matchesState && matchesCity
          })
        : clubsRaw

    const filteredBySurface = surfaces.length > 0
      ? filteredByLocation.filter((club) => {
          const values = normalizeSurfaceList(club).map((value) => value.toLowerCase())
          return surfaces.some((surface) => values.includes(surface.toLowerCase()))
        })
      : filteredByLocation

    let ordered = filteredBySurface
    if (ALLOWED_SORTS.has(sort)) {
      if (sort === "rating_asc") ordered = [...ordered].sort((a, b) => a.rating - b.rating)
      if (sort === "rating_desc") ordered = [...ordered].sort((a, b) => b.rating - a.rating)
      if (sort === "name_asc") ordered = [...ordered].sort((a, b) => a.name.localeCompare(b.name))
      if (sort === "name_desc") ordered = [...ordered].sort((a, b) => b.name.localeCompare(a.name))
      if (sort === "courts_desc") ordered = [...ordered].sort((a, b) => b.courts - a.courts)
    }

    const total = ordered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const items = ordered.slice(start, start + pageSize)

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((club) => ({
          // Photos is Json?; use first image as cover if possible.
          coverImageUrl:
            Array.isArray((club as any).photos) && typeof (club as any).photos[0] === "string"
              ? ((club as any).photos[0] as string)
              : club.logoUrl || null,
          id: club.id,
          name: club.name,
          city: club.city,
          state: club.state,
          country: club.country,
          address: club.address,
          latitude: club.latitude,
          longitude: club.longitude,
          courts: club.courts,
          indoorCourts: club.indoorCourts,
          outdoorCourts: club.outdoorCourts,
          courtSurface: club.courtSurface,
          courtSurfaces: normalizeSurfaceList(club),
          rating: club.rating,
          description: club.description,
          phone: club.phone,
          website: club.website,
          whatsapp: club.whatsapp,
          facebook: club.facebook,
          instagram: club.instagram,
          hasParking: club.hasParking,
          hasLockers: club.hasLockers,
          hasShowers: club.hasShowers,
          hasCafeteria: club.hasCafeteria,
          hasProShop: club.hasProShop,
          hasLighting: club.hasLighting,
          hasAirConditioning: club.hasAirConditioning,
          acceptsOnlineBooking: club.acceptsOnlineBooking,
          logoUrl: club.logoUrl,
          tournaments: club._count.tournaments,
          status: club.status,
        })),
        total,
        page: safePage,
        pageSize,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching clubs:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener clubes" },
      { status: 500 }
    )
  }
}
