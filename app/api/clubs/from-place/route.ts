import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

type GoogleAddressComponent = {
  long_name?: string
  short_name?: string
  types?: string[]
}

type PlaceDetailsLike = {
  name?: string
  formatted_address?: string
  url?: string
  website?: string
  formatted_phone_number?: string
  international_phone_number?: string
  address_components?: GoogleAddressComponent[]
  geometry?: { location?: { lat?: number; lng?: number } }
}

function pickComponent(components: GoogleAddressComponent[] | undefined, type: string, preferShort = false) {
  const hit = components?.find((c) => Array.isArray(c.types) && c.types.includes(type))
  if (!hit) return undefined
  return preferShort ? hit.short_name ?? hit.long_name : hit.long_name ?? hit.short_name
}

function extractLocation(details: PlaceDetailsLike) {
  const components = details.address_components
  const country = pickComponent(components, "country", true) ?? "MX"
  const state =
    pickComponent(components, "administrative_area_level_1", false) ??
    pickComponent(components, "administrative_area_level_2", false) ??
    ""
  const city =
    pickComponent(components, "locality", false) ??
    pickComponent(components, "postal_town", false) ??
    pickComponent(components, "administrative_area_level_3", false) ??
    ""
  const postalCode = pickComponent(components, "postal_code", false)

  const lat = details.geometry?.location?.lat
  const lng = details.geometry?.location?.lng

  return { country, state, city, postalCode, latitude: lat, longitude: lng }
}

async function fetchPlaceDetails(placeId: string) {
  const key =
    process.env.GOOGLE_MAPS_API_KEY_SERVER ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return null

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json")
  url.searchParams.set("place_id", placeId)
  url.searchParams.set(
    "fields",
    [
      "place_id",
      "name",
      "formatted_address",
      "geometry",
      "address_component",
      "url",
      "website",
      "formatted_phone_number",
      "international_phone_number",
    ].join(",")
  )
  url.searchParams.set("key", key)

  const res = await fetch(url.toString(), { method: "GET" })
  const payload = await res.json().catch(() => null)
  if (!payload || payload.status !== "OK" || !payload.result) return null
  return payload.result as PlaceDetailsLike
}

const globalRateLimit = globalThis as unknown as {
  __clubsFromPlaceRateLimit?: Map<string, { count: number; resetAt: number }>
}

function checkAndIncrementRateLimit(userId: string) {
  if (!globalRateLimit.__clubsFromPlaceRateLimit) {
    globalRateLimit.__clubsFromPlaceRateLimit = new Map()
  }
  const now = Date.now()
  const entry = globalRateLimit.__clubsFromPlaceRateLimit.get(userId)
  if (!entry || entry.resetAt < now) {
    globalRateLimit.__clubsFromPlaceRateLimit.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 })
    return { ok: true, remaining: 9 }
  }
  if (entry.count >= 10) return { ok: false, remaining: 0 }
  entry.count += 1
  globalRateLimit.__clubsFromPlaceRateLimit.set(userId, entry)
  return { ok: true, remaining: Math.max(0, 10 - entry.count) }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["PLAYER", "CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const placeId = typeof body?.placeId === "string" ? body.placeId.trim() : ""
    if (!placeId) {
      return NextResponse.json({ success: false, error: "placeId es requerido" }, { status: 400 })
    }

    const existing = await prisma.club.findUnique({ where: { placeId } })
    if (existing) {
      return NextResponse.json(
        { success: true, data: { id: existing.id, name: existing.name, city: existing.city, state: existing.state } },
        { status: 200 }
      )
    }

    const limiter = checkAndIncrementRateLimit(session!.user.id)
    if (!limiter.ok) {
      return NextResponse.json(
        { success: false, error: "Limite de creacion de clubes alcanzado. Intenta mas tarde." },
        { status: 429 }
      )
    }

    // Prefer server-side Places Details; fallback to details sent by the client.
    const serverDetails = await fetchPlaceDetails(placeId)
    const clientDetails = body?.place && typeof body.place === "object" ? (body.place as PlaceDetailsLike) : null
    const details = serverDetails || clientDetails
    if (!details) {
      return NextResponse.json(
        { success: false, error: "No se pudo obtener detalles del lugar. Configura Google Places API." },
        { status: 400 }
      )
    }

    const name = (details.name || "").trim()
    const address = (details.formatted_address || "").trim()
    const { city, state, country, postalCode, latitude, longitude } = extractLocation(details)
    const phone = (details.international_phone_number || details.formatted_phone_number || "").trim() || undefined
    const website = (details.website || "").trim() || undefined
    const googleMapsUrl = (details.url || "").trim() || undefined

    if (!name || !address || !city || !state) {
      return NextResponse.json(
        { success: false, error: "El lugar seleccionado no tiene datos suficientes (nombre/direccion/ciudad/estado)." },
        { status: 400 }
      )
    }

    const created = await prisma.club.create({
      data: {
        placeId,
        createdFromPlaces: true,
        googleMapsUrl,
        status: "APPROVED",
        name,
        address,
        city,
        state,
        country,
        postalCode: postalCode ?? null,
        latitude: typeof latitude === "number" ? latitude : null,
        longitude: typeof longitude === "number" ? longitude : null,
        phone: phone ?? null,
        website: website ?? null,
      },
    })

    return NextResponse.json(
      { success: true, data: { id: created.id, name: created.name, city: created.city, state: created.state } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating club from place:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

