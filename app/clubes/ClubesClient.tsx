"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { getPathname, Link, useRouter } from "@/i18n/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClubFiltersOptions, useClubs } from "@/hooks/use-club"
import { cn } from "@/lib/utils"
import { normalizeLocationToken } from "@/lib/location/keys"
import { GoogleMap, InfoWindowF, MarkerF, useLoadScript } from "@react-google-maps/api"
import {
  Building2,
  MapPin,
  Trophy,
  Star,
  Search,
  Map,
  List,
  Car,
  Lock,
  ShowerHead,
  Utensils,
  Store,
  Lightbulb,
  Snowflake,
  Globe,
  MessageCircle,
  Instagram,
  Facebook,
  Filter,
} from "lucide-react"

function parseCsv(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toWhatsappHref(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D+/g, "")
  if (!digits) return null
  return `https://wa.me/${digits}`
}

function toHref(raw?: string | null) {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  return `https://${value}`
}

function toGoogleMapsHref(params: {
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  city?: string | null
  state?: string | null
}) {
  const lat = params.latitude
  const lng = params.longitude
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
  }
  const parts = [params.address, params.city, params.state].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`
}

function ClubesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale() as "es" | "en"
  const t = useTranslations("ClubesPage")
  const basePath = getPathname({ locale, href: "/clubes" })
  const copy = useMemo(
    () => ({
      heading: t("heading"),
      subheading: t("subheading"),
      searchPlaceholder: t("searchPlaceholder"),
    }),
    [t]
  )
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const currentSearch = searchParams.get("search") ?? ""
  const stateFilter = searchParams.get("stateKey") ?? searchParams.get("state") ?? ""
  const cityFilter = searchParams.get("cityKey") ?? searchParams.get("city") ?? ""
  const viewMode = searchParams.get("view") === "map" ? "map" : "list"
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1)
  const surfaces = parseCsv(searchParams.get("surfaces"))
  const amenities = parseCsv(searchParams.get("amenities"))

  const { data: filtersData } = useClubFiltersOptions({ status: "APPROVED" })
  const states = filtersData?.data?.states ?? []
  const stateLabels = filtersData?.data?.stateLabels ?? {}
  const citiesByState = filtersData?.data?.citiesByState ?? {}
  const cityLabels = filtersData?.data?.cityLabels ?? {}
  const surfaceOptions = filtersData?.data?.surfaces ?? []
  const amenityOptions = filtersData?.data?.amenities ?? []
  const clubsDirectoryMapEnabled = Boolean(filtersData?.data?.clubsDirectoryMapEnabled)

  const cities = useMemo(() => {
    if (stateFilter) return citiesByState[stateFilter] ?? []
    const all = Object.values(citiesByState).flat()
    return Array.from(new Set(all)).sort((a, b) => (cityLabels[a] ?? a).localeCompare(cityLabels[b] ?? b, locale))
  }, [citiesByState, stateFilter, cityLabels])

  const selectedCityLabel = cityFilter ? cityLabels[cityFilter] ?? "" : ""
  const seoCitySlug = selectedCityLabel ? normalizeLocationToken(selectedCityLabel) : ""

  const { data, isLoading } = useClubs({
    status: "APPROVED",
    search: currentSearch || undefined,
    stateKey: stateFilter || undefined,
    cityKey: cityFilter || undefined,
    surfaces: surfaces.length > 0 ? surfaces : undefined,
    amenities: amenities.length > 0 ? amenities : undefined,
    page,
    pageSize: 8,
    sort: "rating_desc",
  })

  const clubs = data?.data?.items ?? []
  const totalPages = data?.data?.totalPages ?? 1
  const total = data?.data?.total ?? 0

  const hasMapsApiKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
  const shouldAttemptMapLoad = clubsDirectoryMapEnabled && viewMode === "map" && hasMapsApiKey
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useLoadScript({
    googleMapsApiKey: shouldAttemptMapLoad ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "" : "",
  })

  const clubsWithCoordinates = clubs.filter((club) => typeof club.latitude === "number" && typeof club.longitude === "number")
  const mapCenter =
    clubsWithCoordinates[0] &&
    typeof clubsWithCoordinates[0].latitude === "number" &&
    typeof clubsWithCoordinates[0].longitude === "number"
      ? { lat: clubsWithCoordinates[0].latitude, lng: clubsWithCoordinates[0].longitude }
      : { lat: 25.6866, lng: -100.3161 }
  const selectedClub = clubsWithCoordinates.find((club) => club.id === selectedMarkerId) ?? null

  function updateParams(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    const query = next.toString()
    router.replace((query ? `${basePath}?${query}` : basePath) as any, { scroll: false })
  }

  function toggleCsvParam(key: "surfaces" | "amenities", value: string) {
    const current = key === "surfaces" ? surfaces : amenities
    const hasValue = current.includes(value)
    const next = hasValue ? current.filter((item) => item !== value) : [...current, value]
    updateParams({
      [key]: next.length > 0 ? next.join(",") : undefined,
      page: "1",
    })
  }

  useEffect(() => {
    setSearchInput(currentSearch)
  }, [currentSearch])

  useEffect(() => {
    if (!clubsDirectoryMapEnabled && viewMode === "map") {
      updateParams({ view: "list", page: "1" })
    }
  }, [clubsDirectoryMapEnabled, viewMode])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput === currentSearch) return
      updateParams({
        search: searchInput.trim() || undefined,
        page: "1",
      })
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [searchInput, currentSearch])

  const amenityIconByKey: Record<string, React.ComponentType<{ className?: string }>> = {
    hasParking: Car,
    hasLockers: Lock,
    hasShowers: ShowerHead,
    hasCafeteria: Utensils,
    hasProShop: Store,
    hasLighting: Lightbulb,
    hasAirConditioning: Snowflake,
    acceptsOnlineBooking: Globe,
  }

  const FiltersPanel = () => (
    <Card className="border-border/60">
      <CardContent className="space-y-5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("filters.title")}</h3>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => {
              setSearchInput("")
              router.replace(basePath as any, { scroll: false })
            }}
          >
            {t("filters.clear")}
          </button>
        </div>

        <div className="space-y-2">
          <Label>{t("filters.state")}</Label>
          <Select
            value={stateFilter || "all"}
            onValueChange={(value) =>
              updateParams({
                stateKey: value === "all" ? undefined : value,
                cityKey: undefined,
                page: "1",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {stateLabels[state] ?? state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("filters.city")}</Label>
          <Select
            value={cityFilter || "all"}
            onValueChange={(value) =>
              updateParams({
                cityKey: value === "all" ? undefined : value,
                page: "1",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allFeminine")}</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {cityLabels[city] ?? city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {seoCitySlug && cityFilter ? (
            <Link
              href={{ pathname: "/torneos/ciudad/[slug]", params: { slug: seoCitySlug } } as any}
              className="inline-flex text-xs font-semibold text-primary hover:underline"
            >
              {t("filters.viewTournamentsIn", { city: selectedCityLabel })}
            </Link>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">{t("filters.courtType")}</p>
          <div className="space-y-2">
            {surfaceOptions.map((surface) => (
              <label key={surface} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={surfaces.includes(surface)} onChange={() => toggleCsvParam("surfaces", surface)} />
                {surface}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">{t("filters.amenities")}</p>
          <div className="grid grid-cols-4 gap-2">
            {amenityOptions.map((amenity) => {
              const Icon = amenityIconByKey[amenity.key] ?? Building2
              const active = amenities.includes(amenity.key)
              return (
                <button
                  key={amenity.key}
                  type="button"
                  title={amenity.label}
                  onClick={() => toggleCsvParam("amenities", amenity.key)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
                  {copy.heading}
                </h1>
                <p className="mt-2 text-muted-foreground">{copy.subheading}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-[280px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="pl-9"
                  />
                </div>
                <div className="flex rounded-lg border border-border/70 bg-muted/40 p-1">
                  <Button
                    type="button"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    className={cn("gap-2", viewMode === "list" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
                    onClick={() => updateParams({ view: "list", page: "1" })}
                  >
                    <List className="h-4 w-4" />
                    {t("view.list")}
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    className={cn("gap-2", viewMode === "map" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
                    onClick={() => updateParams({ view: "map", page: "1" })}
                    disabled={!clubsDirectoryMapEnabled}
                    title={!clubsDirectoryMapEnabled ? t("map.disabledTitle") : t("map.viewTitle")}
                  >
                    <Map className="h-4 w-4" />
                    {t("view.map")}
                  </Button>
                </div>
                <div className="lg:hidden">
                  <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 sm:w-auto">
                        <Filter className="h-4 w-4" />
                        {t("filters.openButton")}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[85vh]">
                      <DrawerHeader className="pb-0">
                        <DrawerTitle>{t("filters.title")}</DrawerTitle>
                      </DrawerHeader>
                      <div className="max-h-[70vh] overflow-auto px-4 pb-4 pt-3">
                        <FiltersPanel />
                      </div>
                      <div className="border-t border-border/60 p-4">
                        <DrawerClose asChild>
                          <Button className="w-full">{t("filters.viewResults")}</Button>
                        </DrawerClose>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-12">
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-20">
                <FiltersPanel />
              </div>
            </aside>

            <div className="space-y-4 lg:col-span-9">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>{isLoading ? t("loading") : t("resultsCount", { count: total })}</p>
                <p>
                  {t("pagination.pageOf", { page, totalPages })}
                </p>
              </div>

              {viewMode === "map" ? (
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    {!clubsDirectoryMapEnabled ? (
                      <p className="text-sm text-muted-foreground">
                        {t("map.disabled")}
                      </p>
                    ) : !hasMapsApiKey ? (
                      <p className="text-sm text-muted-foreground">
                        {t("map.missingApiKey")}
                      </p>
                    ) : mapLoadError ? (
                      <p className="text-sm text-muted-foreground">{t("map.loadError")}</p>
                    ) : !isMapLoaded ? (
                      <p className="text-sm text-muted-foreground">{t("map.loading")}</p>
                    ) : clubsWithCoordinates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("map.noCoordinates")}</p>
                    ) : (
                      <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "560px", borderRadius: "0.75rem" }}
                        center={mapCenter}
                        zoom={11}
                        options={{ streetViewControl: false, mapTypeControl: false }}
                      >
                        {clubsWithCoordinates.map((club) => (
                          <MarkerF
                            key={club.id}
                            position={{ lat: club.latitude as number, lng: club.longitude as number }}
                            onClick={() => setSelectedMarkerId(club.id)}
                          />
                        ))}
                        {selectedClub ? (
                          <InfoWindowF
                            position={{ lat: selectedClub.latitude as number, lng: selectedClub.longitude as number }}
                            onCloseClick={() => setSelectedMarkerId(null)}
                          >
                            <div className="min-w-[180px] p-1 text-sm text-slate-900">
                              <p className="font-semibold">{selectedClub.name}</p>
                              <p className="text-xs">
                                {selectedClub.city}, {selectedClub.state}
                              </p>
                              <Link
                                href={{ pathname: "/clubes/[id]", params: { id: String(selectedClub.id) } } as any}
                                className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                              >
                                {t("viewProfile")}
                              </Link>
                            </div>
                          </InfoWindowF>
                        ) : null}
                      </GoogleMap>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {clubs.map((club) => (
                  <Card
                    key={club.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push({ pathname: "/clubes/[id]", params: { id: String(club.id) } } as any)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        router.push({ pathname: "/clubes/[id]", params: { id: String(club.id) } } as any)
                      }
                    }}
                    className={cn(
                      "group cursor-pointer border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
                    )}
                  >
                    <div className="relative overflow-hidden rounded-t-lg border-b border-border/50">
                      <img
                        src={club.coverImageUrl || "/demo/covers/default.svg"}
                        alt={`Cover ${club.name}`}
                        className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src = "/demo/covers/default.svg"
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur">
                          <img
                            src={club.logoUrl || "/demo/logos/default.svg"}
                            alt={`Logo ${club.name}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).src = "/demo/logos/default.svg"
                            }}
                          />
                        </div>
                        <div className="text-white">
                          <p className="font-display text-base font-bold leading-tight">{club.name}</p>
                          <p className="flex items-center gap-1 text-xs text-white/85">
                            <MapPin className="h-3.5 w-3.5" />
                            {club.city}, {club.state}
                          </p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">{t("card.summary")}</p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <span>{club.courts} canchas</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                            <Trophy className="h-3.5 w-3.5" />
                          </div>
                          <span>{club.tournaments} torneos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                            <Star className="h-3.5 w-3.5" />
                          </div>
                          <span>{club.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(club.courtSurfaces ?? []).slice(0, 2).map((surface) => (
                          <Badge key={surface} variant="outline" className="text-xs">
                            {surface}
                          </Badge>
                        ))}
                        {club.hasCafeteria ? (
                          <Badge variant="secondary" className="text-xs">
                            Cafeteria
                          </Badge>
                        ) : null}
                        {club.hasParking ? (
                          <Badge variant="secondary" className="text-xs">
                            Parking
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < Math.floor(club.rating) ? "fill-primary text-primary" : "text-muted"}`}
                            />
                          ))}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {t("verified")}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex flex-wrap gap-2">
                          {toWhatsappHref(club.whatsapp) ? (
                            <a
                              href={toWhatsappHref(club.whatsapp) as string}
                              target="_blank"
                              rel="noreferrer"
                              title="WhatsApp"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          ) : null}
                          {toHref(club.website) ? (
                            <a
                              href={toHref(club.website) as string}
                              target="_blank"
                              rel="noreferrer"
                              title={t("website")}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          ) : null}
                          {toGoogleMapsHref({
                            latitude: club.latitude,
                            longitude: club.longitude,
                            address: club.address,
                            city: club.city,
                            state: club.state,
                          }) ? (
                            <a
                              href={
                                toGoogleMapsHref({
                                  latitude: club.latitude,
                                  longitude: club.longitude,
                                  address: club.address,
                                  city: club.city,
                                  state: club.state,
                                }) as string
                              }
                              target="_blank"
                              rel="noreferrer"
                              title={t("viewOnGoogleMaps")}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <MapPin className="h-4 w-4" />
                            </a>
                          ) : null}
                          {toHref(club.instagram) ? (
                            <a
                              href={toHref(club.instagram) as string}
                              target="_blank"
                              rel="noreferrer"
                              title="Instagram"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Instagram className="h-4 w-4" />
                            </a>
                          ) : null}
                          {toHref(club.facebook) ? (
                            <a
                              href={toHref(club.facebook) as string}
                              target="_blank"
                              rel="noreferrer"
                              title="Facebook"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Facebook className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!isLoading && clubs.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    {t("empty")}
                  </CardContent>
                </Card>
              ) : null}

              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(Math.max(page - 1, 1)) })}>
                  {t("pagination.prev")}
                </Button>
                {Array.from({ length: totalPages })
                  .slice(0, 6)
                  .map((_, idx) => {
                    const pageNumber = idx + 1
                    return (
                      <Button
                        key={pageNumber}
                        size="sm"
                        variant={pageNumber === page ? "default" : "outline"}
                        className={pageNumber === page ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                        onClick={() => updateParams({ page: String(pageNumber) })}
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(Math.min(page + 1, totalPages)) })}>
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 bg-primary py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center md:flex-row md:text-left lg:px-8">
            <div>
              <h2 className="font-display text-3xl font-black uppercase text-primary-foreground md:text-4xl">{t("cta.title")}</h2>
              <p className="mt-2 text-primary-foreground/90">{t("cta.desc")}</p>
            </div>
            <Link href="/registro">
              <Button className="bg-background text-foreground hover:bg-background/90">{t("cta.button")}</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function ClubesClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="text-sm text-muted-foreground">Cargando directorio de clubes...</p>
          </main>
          <Footer />
        </div>
      }
    >
      <ClubesPageContent />
    </Suspense>
  )
}

