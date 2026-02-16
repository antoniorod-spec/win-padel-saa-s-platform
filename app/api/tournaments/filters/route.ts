import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildCityKey, buildStateKey, normalizeLocationToken, pickBestLabel } from "@/lib/location/keys"
import { TournamentStatus } from "@prisma/client"

type FiltersClubItem = {
  id: string
  name: string
  country: string
  state: string
  city: string
  stateKey: string
  cityKey: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get("status")

    // Optional: scope filter options to a status subset (e.g. UPCOMING/OPEN).
    // Keep behavior permissive and backwards compatible.
    let statusFilter:
      | TournamentStatus
      | { in: TournamentStatus[] }
      | undefined
    if (rawStatus) {
      const requested = rawStatus
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s === "UPCOMING" ? "OPEN" : s))
        .filter((s): s is TournamentStatus => (Object.values(TournamentStatus) as string[]).includes(s))
      statusFilter = requested.length > 1 ? { in: requested } : requested[0]
    }

    const tournaments = await prisma.tournament.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      select: {
        startDate: true,
        endDate: true,
        status: true,
        type: true,
        format: true,
        category: true,
        club: {
          select: {
            id: true,
            name: true,
            country: true,
            state: true,
            city: true,
          },
        },
        modalities: {
          select: {
            modality: true,
            category: true,
          },
        },
      },
    })

    const stateLabelVariants = new Map<string, Set<string>>()
    const cityLabelVariants = new Map<string, Set<string>>()
    const citiesByState = new Map<string, Set<string>>()
    const clubsById = new Map<string, FiltersClubItem>()

    const tournamentStatuses = new Set<string>()
    const tournamentTypes = new Set<string>()
    const tournamentFormats = new Set<string>()
    const tournamentCategories = new Set<string>()
    const modalities = new Set<string>()
    const modalityCategories = new Set<string>()

    let dateMin: Date | null = null
    let dateMax: Date | null = null

    const slugToCityKeys = new Map<string, Set<string>>()
    const slugToCityLabelVariants = new Map<string, Set<string>>()

    for (const t of tournaments) {
      const club = t.club
      const country = club?.country || "MX"
      const state = club?.state || ""
      const city = club?.city || ""

      tournamentStatuses.add(t.status)
      tournamentTypes.add(t.type)
      tournamentFormats.add(t.format)
      tournamentCategories.add(t.category)

      if (t.startDate && (!dateMin || t.startDate < dateMin)) dateMin = t.startDate
      if (t.endDate && (!dateMax || t.endDate > dateMax)) dateMax = t.endDate

      for (const m of t.modalities) {
        if (m.modality) modalities.add(m.modality)
        if (m.category) modalityCategories.add(m.category)
      }

      // Location keys for UI + SEO.
      if (state && city) {
        const stateKey = buildStateKey(country, state)
        const cityKey = buildCityKey(country, state, city)

        if (!stateLabelVariants.has(stateKey)) stateLabelVariants.set(stateKey, new Set())
        stateLabelVariants.get(stateKey)!.add(state)

        if (!cityLabelVariants.has(cityKey)) cityLabelVariants.set(cityKey, new Set())
        cityLabelVariants.get(cityKey)!.add(city)

        if (!citiesByState.has(stateKey)) citiesByState.set(stateKey, new Set())
        citiesByState.get(stateKey)!.add(cityKey)

        if (club?.id && !clubsById.has(club.id)) {
          clubsById.set(club.id, {
            id: club.id,
            name: club.name,
            country,
            state,
            city,
            stateKey,
            cityKey,
          })
        }

        // Slug: use city token (stable, accent-insensitive). If multiple states share same city token,
        // we aggregate cityKeys under one SEO slug.
        const slug = normalizeLocationToken(city)
        if (slug) {
          if (!slugToCityKeys.has(slug)) slugToCityKeys.set(slug, new Set())
          slugToCityKeys.get(slug)!.add(cityKey)

          if (!slugToCityLabelVariants.has(slug)) slugToCityLabelVariants.set(slug, new Set())
          slugToCityLabelVariants.get(slug)!.add(city)
        }
      }
    }

    const stateLabels: Record<string, string> = {}
    for (const [key, labels] of stateLabelVariants.entries()) {
      stateLabels[key] = pickBestLabel(Array.from(labels))
    }

    const cityLabels: Record<string, string> = {}
    for (const [key, labels] of cityLabelVariants.entries()) {
      cityLabels[key] = pickBestLabel(Array.from(labels))
    }

    const states = Array.from(stateLabelVariants.keys()).sort((a, b) =>
      (stateLabels[a] ?? a).localeCompare(stateLabels[b] ?? b, "es")
    )

    const citiesByStateObject: Record<string, string[]> = {}
    for (const stateKey of states) {
      const cities = Array.from(citiesByState.get(stateKey) ?? [])
      cities.sort((a, b) => (cityLabels[a] ?? a).localeCompare(cityLabels[b] ?? b, "es"))
      citiesByStateObject[stateKey] = cities
    }

    const clubs = Array.from(clubsById.values()).sort((a, b) => a.name.localeCompare(b.name, "es"))

    const citySlugToCityKeysObject: Record<string, string[]> = {}
    const citySlugLabels: Record<string, string> = {}
    for (const [slug, keys] of slugToCityKeys.entries()) {
      citySlugToCityKeysObject[slug] = Array.from(keys)
      const labelVariants = Array.from(slugToCityLabelVariants.get(slug) ?? [])
      citySlugLabels[slug] = pickBestLabel(labelVariants) || slug
    }

    return NextResponse.json({
      success: true,
      data: {
        // Location
        states,
        citiesByState: citiesByStateObject,
        stateLabels,
        cityLabels,

        // SEO helper
        citySlugToCityKeys: citySlugToCityKeysObject,
        citySlugLabels,

        // Filters
        tournamentStatuses: Array.from(tournamentStatuses).sort(),
        tournamentTypes: Array.from(tournamentTypes).sort(),
        tournamentFormats: Array.from(tournamentFormats).sort(),
        tournamentCategories: Array.from(tournamentCategories).sort(),
        modalities: Array.from(modalities).sort(),
        modalityCategories: Array.from(modalityCategories).sort(),
        clubs,

        // Dates
        dateMin: dateMin ? dateMin.toISOString() : null,
        dateMax: dateMax ? dateMax.toISOString() : null,
      },
    })
  } catch (error) {
    console.error("Error fetching tournament filter options:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener filtros de torneos" },
      { status: 500 }
    )
  }
}

