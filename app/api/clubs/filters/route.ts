import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ClubStatus } from "@prisma/client"
import { buildCityKey, buildStateKey, pickBestLabel } from "@/lib/location/keys"

const AMENITY_LABELS: Record<string, string> = {
  hasParking: "Estacionamiento",
  hasLockers: "Vestidores",
  hasShowers: "Regaderas",
  hasCafeteria: "Cafeteria",
  hasProShop: "Pro shop",
  hasLighting: "Iluminacion",
  hasAirConditioning: "Aire acondicionado",
  acceptsOnlineBooking: "Reserva online",
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
    const rawStatus = searchParams.get("status") ?? "APPROVED"
    const status: ClubStatus =
      rawStatus === "PENDING" || rawStatus === "APPROVED" || rawStatus === "REJECTED"
        ? rawStatus
        : "APPROVED"

    const clubs = await prisma.club.findMany({
      where: { status },
      select: {
        country: true,
        state: true,
        city: true,
        courtSurface: true,
        courtSurfaces: true,
        hasParking: true,
        hasLockers: true,
        hasShowers: true,
        hasCafeteria: true,
        hasProShop: true,
        hasLighting: true,
        hasAirConditioning: true,
        acceptsOnlineBooking: true,
      },
    })

    const statesSet = new Set<string>() // stateKey
    const stateLabelVariants = new Map<string, string[]>()
    const cityLabelVariants = new Map<string, string[]>()
    const citiesByState = new Map<string, Set<string>>() // stateKey -> cityKey
    const surfacesSet = new Set<string>()

    const amenityCount: Record<string, number> = {
      hasParking: 0,
      hasLockers: 0,
      hasShowers: 0,
      hasCafeteria: 0,
      hasProShop: 0,
      hasLighting: 0,
      hasAirConditioning: 0,
      acceptsOnlineBooking: 0,
    }

    for (const club of clubs) {
      const country = club.country || "XX"
      const stateLabel = club.state?.trim?.() ?? ""
      const cityLabel = club.city?.trim?.() ?? ""
      if (stateLabel) {
        const stateKey = buildStateKey(country, stateLabel)
        statesSet.add(stateKey)
        if (!stateLabelVariants.has(stateKey)) stateLabelVariants.set(stateKey, [])
        stateLabelVariants.get(stateKey)!.push(stateLabel)

        if (!citiesByState.has(stateKey)) citiesByState.set(stateKey, new Set<string>())
        if (cityLabel) {
          const cityKey = buildCityKey(country, stateLabel, cityLabel)
          citiesByState.get(stateKey)!.add(cityKey)
          if (!cityLabelVariants.has(cityKey)) cityLabelVariants.set(cityKey, [])
          cityLabelVariants.get(cityKey)!.push(cityLabel)
        }
      }

      for (const surface of normalizeSurfaceList(club)) {
        surfacesSet.add(surface)
      }

      if (club.hasParking) amenityCount.hasParking += 1
      if (club.hasLockers) amenityCount.hasLockers += 1
      if (club.hasShowers) amenityCount.hasShowers += 1
      if (club.hasCafeteria) amenityCount.hasCafeteria += 1
      if (club.hasProShop) amenityCount.hasProShop += 1
      if (club.hasLighting) amenityCount.hasLighting += 1
      if (club.hasAirConditioning) amenityCount.hasAirConditioning += 1
      if (club.acceptsOnlineBooking) amenityCount.acceptsOnlineBooking += 1
    }

    const stateLabels: Record<string, string> = {}
    for (const [stateKey, labels] of stateLabelVariants.entries()) {
      stateLabels[stateKey] = pickBestLabel(labels)
    }

    const cityLabels: Record<string, string> = {}
    for (const [cityKey, labels] of cityLabelVariants.entries()) {
      cityLabels[cityKey] = pickBestLabel(labels)
    }

    const states = Array.from(statesSet).sort((a, b) => (stateLabels[a] ?? a).localeCompare(stateLabels[b] ?? b))
    const citiesByStateObject: Record<string, string[]> = {}
    for (const state of states) {
      citiesByStateObject[state] = Array.from(citiesByState.get(state) ?? []).sort((a, b) => (cityLabels[a] ?? a).localeCompare(cityLabels[b] ?? b))
    }

    const amenities = Object.entries(AMENITY_LABELS).map(([key, label]) => ({
      key,
      label,
      count: amenityCount[key] ?? 0,
    }))

    const platformSettings = await prisma.platformSetting.findUnique({
      where: { id: "global" },
      select: { clubsDirectoryMapEnabled: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        states,
        stateLabels,
        citiesByState: citiesByStateObject,
        cityLabels,
        surfaces: Array.from(surfacesSet).sort((a, b) => a.localeCompare(b)),
        clubsDirectoryMapEnabled: Boolean(platformSettings?.clubsDirectoryMapEnabled),
        amenities,
      },
    })
  } catch (error) {
    console.error("Error fetching club filter options:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener filtros de clubes" },
      { status: 500 }
    )
  }
}
