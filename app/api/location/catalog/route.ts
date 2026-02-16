import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildCityKey, buildStateKey, pickBestLabel } from "@/lib/location/keys"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryParam = searchParams.get("country")
    const country = typeof countryParam === "string" && countryParam.trim() ? countryParam.trim().toUpperCase() : null

    const clubs = await prisma.club.findMany({
      ...(country ? { where: { country } } : {}),
      select: {
        country: true,
        state: true,
        city: true,
      },
    })

    const stateLabelVariants = new Map<string, string[]>()
    const cityLabelVariants = new Map<string, string[]>()
    const citiesByStateKey = new Map<string, Set<string>>()

    for (const club of clubs) {
      const clubCountry = club.country || "XX"
      const stateLabel = typeof club.state === "string" ? club.state.trim() : ""
      const cityLabel = typeof club.city === "string" ? club.city.trim() : ""
      if (!stateLabel) continue

      const stateKey = buildStateKey(clubCountry, stateLabel)
      if (!stateLabelVariants.has(stateKey)) stateLabelVariants.set(stateKey, [])
      stateLabelVariants.get(stateKey)!.push(stateLabel)

      if (!citiesByStateKey.has(stateKey)) citiesByStateKey.set(stateKey, new Set<string>())
      if (cityLabel) {
        const cityKey = buildCityKey(clubCountry, stateLabel, cityLabel)
        citiesByStateKey.get(stateKey)!.add(cityKey)
        if (!cityLabelVariants.has(cityKey)) cityLabelVariants.set(cityKey, [])
        cityLabelVariants.get(cityKey)!.push(cityLabel)
      }
    }

    const stateLabels: Record<string, string> = {}
    for (const [stateKey, labels] of stateLabelVariants.entries()) {
      stateLabels[stateKey] = pickBestLabel(labels)
    }

    const cityLabels: Record<string, string> = {}
    for (const [cityKey, labels] of cityLabelVariants.entries()) {
      cityLabels[cityKey] = pickBestLabel(labels)
    }

    const stateKeys = Array.from(stateLabelVariants.keys()).sort((a, b) =>
      (stateLabels[a] ?? a).localeCompare(stateLabels[b] ?? b)
    )

    const citiesByState: Record<string, string[]> = {}
    for (const stateKey of stateKeys) {
      const cities = Array.from(citiesByStateKey.get(stateKey) ?? [])
      citiesByState[stateKey] = cities.sort((a, b) =>
        (cityLabels[a] ?? a).localeCompare(cityLabels[b] ?? b)
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        states: stateKeys,
        stateLabels,
        citiesByState,
        cityLabels,
      },
    })
  } catch (error) {
    console.error("Error fetching location catalog:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener catalogo de ubicaciones" },
      { status: 500 }
    )
  }
}

