"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { getPathname, Link, useRouter } from "@/i18n/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const locale = useLocale() as "es" | "en"
  const tr = useTranslations("TorneosPage")
  const localeTag = locale === "en" ? "en-US" : "es-MX"
  const basePath = getPathname({ locale, href: "/torneos" })

  const copy = useMemo(
    () => ({
      titleBase: tr("titleBase"),
      titleIn: tr("titleIn"),
      heroAll: tr("heroAll"),
      heroDesc: tr("heroDesc"),
      searchPlaceholder: tr("searchPlaceholder"),
    }),
    [tr]
  )

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
  const [posterModal, setPosterModal] = useState<{ url: string; title: string } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

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
    router.replace((query ? `${basePath}?${query}` : basePath) as any, { scroll: false })
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
    return Array.from(new Set(all)).sort((a, b) => (cityLabels[a] ?? a).localeCompare(cityLabels[b] ?? b, locale))
  }, [citiesByState, stateKey, cityLabels])

  const selectedStateLabel = stateKey ? stateLabels[stateKey] ?? "" : ""
  const selectedCityLabel = cityKey ? cityLabels[cityKey] ?? "" : ""
  const seoCitySlug = selectedCityLabel ? normalizeLocationToken(selectedCityLabel) : ""

  // UX only (not SEO): make title feel responsive even though this is a client page.
  useEffect(() => {
    const base = copy.titleBase
    if (selectedCityLabel) {
      document.title = `${copy.titleIn} ${selectedCityLabel} | WhinPadel`
      return
    }
    if (selectedStateLabel) {
      document.title = `${copy.titleIn} ${selectedStateLabel} | WhinPadel`
      return
    }
    document.title = base
  }, [selectedCityLabel, selectedStateLabel, copy])

  const heroTitle = selectedCityLabel
    ? `${copy.titleIn} ${selectedCityLabel}`
    : selectedStateLabel
      ? `${copy.titleIn} ${selectedStateLabel}`
      : copy.heroAll

  const FiltersPanel = () => (
    <Card className="border-border/60">
      <CardContent className="space-y-5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">{tr("filters.title")}</h3>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => router.replace(basePath as any, { scroll: false })}
          >
            {tr("filters.clear")}
          </button>
        </div>

        <div className="space-y-2">
          <Label>{tr("filters.state")}</Label>
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
              <SelectItem value="all">{tr("filters.all")}</SelectItem>
              {states.map((s) => (
                <SelectItem key={s} value={s}>
                  {stateLabels[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{tr("filters.city")}</Label>
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
              <SelectItem value="all">{tr("filters.allFeminine")}</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {cityLabels[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {seoCitySlug && cityKey ? (
            <Link
              href={{ pathname: "/torneos/ciudad/[slug]", params: { slug: seoCitySlug } } as any}
              className="inline-flex text-xs font-semibold text-primary hover:underline"
            >
              {tr("filters.seoCityLink", { city: selectedCityLabel })}
            </Link>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>{tr("filters.dates")}</Label>
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
          <Label>{tr("filters.status")}</Label>
          <div className="grid gap-2">
            {[
              { key: "OPEN", label: tr("statusLabels.open") },
              { key: "IN_PROGRESS", label: tr("statusLabels.inProgress") },
              { key: "DRAFT", label: tr("statusLabels.upcoming") },
              { key: "COMPLETED", label: tr("statusLabels.past") },
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
          <Label>{tr("filters.tournamentType")}</Label>
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
              <SelectItem value="all">{tr("filters.all")}</SelectItem>
              <SelectItem value="MAJOR">Major</SelectItem>
              <SelectItem value="REGULAR">Regular</SelectItem>
              <SelectItem value="EXPRESS">Express</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{tr("filters.tournamentTypeHint")}</p>
        </div>

        <div className="space-y-2">
          <Label>{tr("filters.modalityCategories")}</Label>
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
          <Label>{tr("filters.modality")}</Label>
          <Select
            value={modality || "all"}
            onValueChange={(v) => updateParams({ modality: v === "all" ? undefined : v, page: "1" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("filters.allFeminine")}</SelectItem>
              {modalityOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{tr("filters.format")}</Label>
          <Select
            value={format || "all"}
            onValueChange={(v) => updateParams({ format: v === "all" ? undefined : v, page: "1" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("filters.all")}</SelectItem>
              {formatOptions.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{tr("filters.club")}</Label>
          <Select
            value={clubId || "all"}
            onValueChange={(v) => updateParams({ clubId: v === "all" ? undefined : v, page: "1" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("filters.all")}</SelectItem>
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
                  {heroTitle}
                </h1>
                <p className="mt-2 text-muted-foreground">{copy.heroDesc}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
                    {tr("view.list")}
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
                    {tr("view.calendar")}
                  </Button>
                </div>
                <div className="lg:hidden">
                  <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 sm:w-auto">
                        <Filter className="h-4 w-4" />
                        {tr("filters.openButton")}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[85vh]">
                      <DrawerHeader className="pb-0">
                        <DrawerTitle>{tr("filters.title")}</DrawerTitle>
                      </DrawerHeader>
                      <div className="max-h-[70vh] overflow-auto px-4 pb-4 pt-3">
                        <FiltersPanel />
                      </div>
                      <div className="border-t border-border/60 p-4">
                        <DrawerClose asChild>
                          <Button className="w-full">{tr("filters.viewResults")}</Button>
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
                <p>{isLoading ? tr("loading") : tr("resultsCount", { count: total })}</p>
                {viewMode === "list" ? (
                  <p>
                    {tr("pagination.pageOf", { page, totalPages })}
                  </p>
                ) : null}
              </div>

              {viewMode === "calendar" ? (
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-xl font-black uppercase tracking-wide">
                        {calendarMonth.toLocaleDateString(localeTag, { month: "long", year: "numeric" })}
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
                        {(locale === "en"
                          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                          : ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
                        ).map((d) => (
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
                                      href={{ pathname: "/torneos/[id]", params: { id: String(t.id) } } as any}
                                      className="block rounded bg-primary px-2 py-1 text-[10px] font-black uppercase text-primary-foreground hover:opacity-90"
                                      title={t.name}
                                    >
                                      {t.name}
                                    </Link>
                                  ))}
                                  {dayTournaments.length > 2 ? (
                                    <span className="block text-[10px] font-bold text-muted-foreground">
                                      {tr("calendar.moreCount", { count: dayTournaments.length - 2 })}
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
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">{tr("loading")}</CardContent>
                  </Card>
                ) : tournaments.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      {tr("empty")}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {tournaments.map((t: any) => {
                      const isAlmostFull = t.registeredTeams >= t.maxTeams * 0.9
                      const hasPoster =
                        (typeof t.posterUrl === "string" && t.posterUrl.trim()) ||
                        (typeof t.logoUrl === "string" && t.logoUrl.trim())
                      const posterUrl =
                        (typeof t.posterUrl === "string" && t.posterUrl.trim() ? t.posterUrl.trim() : null) ||
                        (typeof t.logoUrl === "string" && t.logoUrl.trim() ? t.logoUrl.trim() : null) ||
                        "/demo/covers/default.svg"
                      const citySlug = typeof t.city === "string" && t.city.trim() ? normalizeLocationToken(t.city) : ""
                      const cityLabel = [t.city, t.state].filter(Boolean).join(t.state ? ", " : "")
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
                                    <Badge variant="secondary">{tr("statusLabels.open")}</Badge>
                                  ) : null}
                                  {isAlmostFull ? <Badge className="bg-destructive/10 text-destructive">{tr("almostFull")}</Badge> : null}
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
                                {new Date(t.startDate).toLocaleDateString(localeTag)} - {new Date(t.endDate).toLocaleDateString(localeTag)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {citySlug ? (
                                  <Link
                                    href={{ pathname: "/torneos/ciudad/[slug]", params: { slug: citySlug } } as any}
                                    className="font-semibold text-foreground/80 hover:underline"
                                    title={tr("viewTournamentsInTitle", { city: t.city })}
                                  >
                                    {cityLabel || t.city}
                                  </Link>
                                ) : (
                                  <span>{cityLabel || "N/D"}</span>
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {tr("teamsCount", { registered: t.registeredTeams, max: t.maxTeams })}
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
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={!hasPoster}
                                  onClick={() => setPosterModal({ url: posterUrl, title: `Cartel: ${t.name}` })}
                                >
                                  {tr("viewPoster")}
                                </Button>
                                <Link href={{ pathname: "/torneos/[id]", params: { id: String(t.id) } } as any}>
                                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    {tr("viewTournament")}
                                  </Button>
                                </Link>
                              </div>
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
                    {tr("pagination.prev")}
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
                    {tr("pagination.next")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog
        open={!!posterModal}
        onOpenChange={(open) => {
          if (!open) setPosterModal(null)
        }}
      >
        <DialogContent className="max-w-4xl border-border/60 bg-card p-0">
          <DialogHeader className="border-b border-border/60 px-4 py-3">
            <DialogTitle className="font-display text-base font-black uppercase tracking-wide">
              {posterModal?.title ?? "Cartel"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              <img
                src={posterModal?.url ?? "/demo/covers/default.svg"}
                alt={posterModal?.title ?? "Cartel"}
                className="h-auto w-full object-contain"
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = "/demo/covers/default.svg"
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TorneosClient() {
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

