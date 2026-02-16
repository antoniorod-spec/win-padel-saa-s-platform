"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users, Trophy, Search, List, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { useTournamentFiltersOptions, useTournaments } from "@/hooks/use-tournaments"
import { cn } from "@/lib/utils"
import { normalizeLocationToken } from "@/lib/location/keys"

function parseCsv(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toISODateInputValue(value: string | null) {
  if (!value) return ""
  // Accept YYYY-MM-DD or ISO strings.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function monthToParam(date: Date) {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

function monthFromParam(raw: string | null) {
  if (!raw) return null
  const m = raw.trim().match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const yyyy = parseInt(m[1], 10)
  const mm = parseInt(m[2], 10)
  if (!yyyy || !mm || mm < 1 || mm > 12) return null
  return new Date(yyyy, mm - 1, 1)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function TorneosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const viewMode = searchParams.get("view") === "calendar" ? "calendar" : "list"
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1)

  const search = searchParams.get("search") ?? ""
  const stateKey = searchParams.get("stateKey") ?? ""
  const cityKey = searchParams.get("cityKey") ?? ""
  const status = parseCsv(searchParams.get("status"))
  const modality = searchParams.get("modality") ?? ""
  const modalityCategories = parseCsv(searchParams.get("modalityCategories"))
  const tournamentClass = searchParams.get("tournamentClass") ?? ""
  const format = searchParams.get("format") ?? ""
  const clubId = searchParams.get("clubId") ?? ""
  const from = toISODateInputValue(searchParams.get("from"))
  const to = toISODateInputValue(searchParams.get("to"))
  const monthParam = searchParams.get("month")

  const [searchInput, setSearchInput] = useState(search)

  const { data: filtersData } = useTournamentFiltersOptions()
  const filterPayload = filtersData?.data

  const states = filterPayload?.states ?? []
  const stateLabels = filterPayload?.stateLabels ?? {}
  const citiesByState = filterPayload?.citiesByState ?? {}
  const cityLabels = filterPayload?.cityLabels ?? {}
  const clubs = filterPayload?.clubs ?? []
  const modalityCategoryOptions = filterPayload?.modalityCategories ?? []
  const modalityOptions = filterPayload?.modalities ?? []
  const formatOptions = filterPayload?.tournamentFormats ?? []

  const calendarMonth = useMemo(() => {
    const fromParam = monthFromParam(monthParam)
    if (fromParam) return fromParam
    // If user already filtered by from/to, anchor calendar there.
    const anchor = from ? new Date(from) : null
    if (anchor && !Number.isNaN(anchor.getTime())) return startOfMonth(anchor)
    return startOfMonth(new Date())
  }, [monthParam, from])

  const calendarRange = useMemo(() => {
    const start = startOfMonth(calendarMonth)
    const end = endOfMonth(calendarMonth)
    return { start, end }
  }, [calendarMonth])

  function updateParams(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    const query = next.toString()
    router.replace(query ? `/torneos?${query}` : "/torneos", { scroll: false })
  }

  function toggleCsvParam(key: "status" | "modalityCategories", value: string) {
    const current = key === "status" ? status : modalityCategories
    const hasValue = current.includes(value)
    const next = hasValue ? current.filter((item) => item !== value) : [...current, value]
    updateParams({
      [key]: next.length > 0 ? next.join(",") : undefined,
      page: "1",
    })
  }

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput === search) return
      updateParams({
        search: searchInput.trim() || undefined,
        page: "1",
      })
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [searchInput, search])

  const tournamentsQuery = useMemo(() => {
    const base = {
      search: search.trim() || undefined,
      stateKey: stateKey || undefined,
      cityKey: cityKey || undefined,
      status: status.length > 0 ? status.join(",") : undefined,
      modality: modality || undefined,
      modalityCategories: modalityCategories.length > 0 ? modalityCategories.join(",") : undefined,
        tournamentClass: tournamentClass || undefined,
      format: format || undefined,
      clubId: clubId || undefined,
      from: from || undefined,
      to: to || undefined,
    }

    if (viewMode === "calendar") {
      return {
        ...base,
        // Calendar should show everything in the month for smooth UX.
        page: 1,
        pageSize: 200,
        from: calendarRange.start.toISOString(),
        to: calendarRange.end.toISOString(),
      }
    }

    return {
      ...base,
      page,
      pageSize: 12,
    }
  }, [
    search,
    stateKey,
    cityKey,
    status,
    modality,
    modalityCategories,
    tournamentClass,
    format,
    clubId,
    from,
    to,
    viewMode,
    page,
    calendarRange,
  ])

  const { data: tournamentsData, isLoading } = useTournaments(tournamentsQuery)

  const tournaments = tournamentsData?.data?.items || []
  const totalPages = tournamentsData?.data?.totalPages ?? 1
  const total = tournamentsData?.data?.total ?? tournaments.length

  const cities = useMemo(() => {
    if (stateKey) return citiesByState[stateKey] ?? []
    const all = Object.values(citiesByState).flat()
    return Array.from(new Set(all)).sort((a, b) => (cityLabels[a] ?? a).localeCompare(cityLabels[b] ?? b, "es"))
  }, [citiesByState, stateKey, cityLabels])

  const selectedCityLabel = cityKey ? cityLabels[cityKey] ?? "" : ""
  const seoCitySlug = selectedCityLabel ? normalizeLocationToken(selectedCityLabel) : ""

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
                  Torneos
                </h1>
                <p className="mt-2 text-muted-foreground">Explora torneos por ciudad, fecha, modalidad y club.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="relative min-w-[280px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar por nombre de torneo o club..."
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
                    Lista
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      viewMode === "calendar" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                    )}
                    onClick={() =>
                      updateParams({
                        view: "calendar",
                        page: "1",
                        month: monthToParam(calendarMonth),
                      })
                    }
                  >
                    <Calendar className="h-4 w-4" />
                    Calendario
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <Card className="sticky top-20 border-border/60">
                <CardContent className="space-y-5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Filtros</h3>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => router.replace("/torneos", { scroll: false })}
                    >
                      Limpiar
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={stateKey || "all"}
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
                        <SelectItem value="all">Todos</SelectItem>
                        {states.map((s) => (
                          <SelectItem key={s} value={s}>
                            {stateLabels[s] ?? s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Select
                      value={cityKey || "all"}
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
                        <SelectItem value="all">Todas</SelectItem>
                        {cities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {cityLabels[c] ?? c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {seoCitySlug && cityKey ? (
                      <Link
                        href={`/torneos/ciudad/${seoCitySlug}`}
                        className="inline-flex text-xs font-semibold text-primary hover:underline"
                      >
                        Ver página SEO: Torneos de Pádel en {selectedCityLabel}
                      </Link>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Fechas</Label>
                    <div className="grid gap-2">
                      <Input
                        type="date"
                        value={from}
                        onChange={(e) => updateParams({ from: e.target.value || undefined, page: "1" })}
                      />
                      <Input
                        type="date"
                        value={to}
                        onChange={(e) => updateParams({ to: e.target.value || undefined, page: "1" })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="grid gap-2">
                      {[
                        { key: "OPEN", label: "Inscripciones" },
                        { key: "IN_PROGRESS", label: "En curso" },
                        { key: "DRAFT", label: "Futuros" },
                        { key: "COMPLETED", label: "Pasados" },
                      ].map((opt) => (
                        <label key={opt.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={status.includes(opt.key)}
                            onChange={() => toggleCsvParam("status", opt.key)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de torneo</Label>
                    <Select
                      value={tournamentClass || "all"}
                      onValueChange={(v) =>
                        updateParams({
                          tournamentClass: v === "all" ? undefined : v,
                          page: "1",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="MAJOR">Major</SelectItem>
                        <SelectItem value="REGULAR">Regular</SelectItem>
                        <SelectItem value="EXPRESS">Express</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Express = formato EXPRESS. Major/Regular se estiman por categoría (A vs B/C).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Categorías (modalidad)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {modalityCategoryOptions.slice(0, 12).map((cat) => {
                        const active = modalityCategories.includes(cat)
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCsvParam("modalityCategories", cat)}
                            className={cn(
                              "rounded-md border px-2 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
                              active
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Modalidad</Label>
                    <Select value={modality || "all"} onValueChange={(v) => updateParams({ modality: v === "all" ? undefined : v, page: "1" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {modalityOptions.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select value={format || "all"} onValueChange={(v) => updateParams({ format: v === "all" ? undefined : v, page: "1" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {formatOptions.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Club</Label>
                    <Select
                      value={clubId || "all"}
                      onValueChange={(v) => updateParams({ clubId: v === "all" ? undefined : v, page: "1" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {clubs.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <div className="space-y-4 lg:col-span-9">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>{isLoading ? "Cargando torneos..." : `${total} torneos encontrados`}</p>
                {viewMode === "list" ? (
                  <p>
                    Página {page} de {totalPages}
                  </p>
                ) : null}
              </div>

              {viewMode === "calendar" ? (
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-xl font-black uppercase tracking-wide">
                        {calendarMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const prev = new Date(calendarMonth)
                            prev.setMonth(prev.getMonth() - 1)
                            updateParams({ month: monthToParam(prev) })
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const next = new Date(calendarMonth)
                            next.setMonth(next.getMonth() + 1)
                            updateParams({ month: monthToParam(next) })
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
                      <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40">
                        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
                          <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {d}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7">
                        {(() => {
                          const monthStart = startOfMonth(calendarMonth)
                          const weekday = monthStart.getDay()
                          const gridStart = new Date(monthStart)
                          gridStart.setDate(monthStart.getDate() - weekday)
                          const cells = Array.from({ length: 42 }).map((_, i) => {
                            const d = new Date(gridStart)
                            d.setDate(gridStart.getDate() + i)
                            return d
                          })
                          return cells.map((day) => {
                            const inMonth = day.getMonth() === calendarMonth.getMonth()
                            const dayTournaments = tournaments.filter((t: any) => isSameDay(new Date(t.startDate), day))
                            return (
                              <div
                                key={day.toISOString()}
                                className={cn(
                                  "min-h-[110px] border-b border-r border-border/40 p-2 text-xs",
                                  day.getDay() === 6 ? "border-r-0" : "",
                                  inMonth ? "text-foreground" : "text-muted-foreground/40"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <span className={cn("text-sm font-semibold", inMonth ? "" : "opacity-50")}>{day.getDate()}</span>
                                </div>
                                <div className="mt-2 space-y-1">
                                  {dayTournaments.slice(0, 2).map((t: any) => (
                                    <Link
                                      key={t.id}
                                      href={`/torneos/${t.id}`}
                                      className="block rounded bg-primary px-2 py-1 text-[10px] font-black uppercase text-primary-foreground hover:opacity-90"
                                      title={t.name}
                                    >
                                      {t.name}
                                    </Link>
                                  ))}
                                  {dayTournaments.length > 2 ? (
                                    <span className="block text-[10px] font-bold text-muted-foreground">
                                      +{dayTournaments.length - 2} más
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {viewMode === "list" ? (
                isLoading ? (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">Cargando torneos...</CardContent>
                  </Card>
                ) : tournaments.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      No se encontraron torneos con los filtros actuales.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {tournaments.map((t: any) => {
                      const isAlmostFull = t.registeredTeams >= t.maxTeams * 0.9
                      const posterUrl =
                        (typeof t.posterUrl === "string" && t.posterUrl.trim() ? t.posterUrl.trim() : null) ||
                        (typeof t.logoUrl === "string" && t.logoUrl.trim() ? t.logoUrl.trim() : null) ||
                        "/demo/covers/default.svg"
                      return (
                        <Card key={t.id} className="group border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                          <div className="relative overflow-hidden rounded-t-lg border-b border-border/50">
                            <img
                              src={posterUrl}
                              alt={`Cartel ${t.name}`}
                              className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                              onError={(e) => {
                                ;(e.currentTarget as HTMLImageElement).src = "/demo/covers/default.svg"
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                          </div>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                                    {t.type} • {t.format}
                                  </Badge>
                                  {status.length === 0 && t.status === "OPEN" ? (
                                    <Badge variant="secondary">Inscripciones</Badge>
                                  ) : null}
                                  {isAlmostFull ? <Badge className="bg-destructive/10 text-destructive">Casi lleno</Badge> : null}
                                </div>
                                <h3 className="mt-2 font-display text-xl font-bold text-card-foreground transition-colors group-hover:text-primary">
                                  {t.name}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">{t.clubName}</p>
                              </div>
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Trophy className="h-6 w-6 text-primary" />
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {t.city}{t.state ? `, ${t.state}` : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {t.registeredTeams}/{t.maxTeams} parejas
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {t.modalities.map((m: string) => (
                                <Badge key={m} variant="secondary" className="text-[10px] font-medium">
                                  {m}
                                </Badge>
                              ))}
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                              <div>
                                {t.prize ? (
                                  <span className="font-display text-lg font-bold text-primary">{t.prize}</span>
                                ) : (
                                  <span className="font-display text-lg font-bold text-primary">${t.inscriptionPrice}</span>
                                )}
                              </div>
                              <Link href={`/torneos/${t.id}`}>
                                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                  Ver Torneo
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )
              ) : null}

              {viewMode === "list" ? (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
                    Siguiente
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function TorneosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="text-sm text-muted-foreground">Cargando torneos...</p>
          </main>
          <Footer />
        </div>
      }
    >
      <TorneosPageContent />
    </Suspense>
  )
}
