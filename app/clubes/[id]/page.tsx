"use client"

import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClub } from "@/hooks/use-club"
import { cn } from "@/lib/utils"
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Building2,
  Trophy,
  Users,
  Star,
  Car,
  Lock,
  ShowerHead,
  Utensils,
  Store,
  Lightbulb,
  Snowflake,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  MessageCircle,
} from "lucide-react"

function toHref(raw?: string | null) {
  if (!raw) return null
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
  return `https://${raw}`
}

function toWhatsappHref(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D+/g, "")
  if (!digits) return null
  return `https://wa.me/${digits}`
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

function formatCompactNumber(value: number, localeTag: string) {
  try {
    return new Intl.NumberFormat(localeTag, { notation: "compact", maximumFractionDigits: 1 }).format(value)
  } catch {
    return String(value)
  }
}

function formatNumber(value: number, localeTag: string) {
  try {
    return new Intl.NumberFormat(localeTag).format(value)
  } catch {
    return String(value)
  }
}

function formatDate(value: string | Date, localeTag: string) {
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "Fecha no disponible"
  return d.toLocaleDateString(localeTag, { year: "numeric", month: "short", day: "2-digit" })
}

function initialsFromName(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean)
  const first = parts[0]?.[0] ?? "?"
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return `${first}${second}`.toUpperCase()
}

export default function ClubPublicProfilePage() {
  const locale = useLocale() as "es" | "en"
  const t = useTranslations("ClubDetail")
  const localeTag = locale === "en" ? "en-US" : "es-MX"
  const params = useParams<{ id: string }>()
  const clubId = params?.id
  const { data, isLoading } = useClub(clubId)
  const club = data?.data

  const coverImageUrl =
    Array.isArray(club?.photos) && typeof club.photos[0] === "string"
      ? club.photos[0]
      : "/demo/covers/default.svg"
  const logoUrl = club?.logoUrl || "/demo/logos/default.svg"
  const mapsHref = club
    ? toGoogleMapsHref({
        latitude: club.latitude,
        longitude: club.longitude,
        address: club.address,
        city: club.city,
        state: club.state,
      })
    : null

  const socialLinks = [
    { label: "Facebook", href: toHref(club?.facebook), icon: Facebook },
    { label: "Instagram", href: toHref(club?.instagram), icon: Instagram },
    { label: "TikTok", href: toHref(club?.tiktok), icon: MessageCircle },
    { label: "YouTube", href: toHref(club?.youtube), icon: Youtube },
    { label: "LinkedIn", href: toHref(club?.linkedin), icon: Linkedin },
    { label: "X", href: toHref(club?.x), icon: MessageCircle },
    { label: "WhatsApp", href: toWhatsappHref(club?.whatsapp), icon: MessageCircle },
  ].filter((item) => Boolean(item.href))

  const ranking = Array.isArray(club?.playersRanking) ? club.playersRanking : []
  const rankingTop = ranking.slice(0, 10)

  const amenityItems: Array<{
    key: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    enabled: boolean
  }> = [
    { key: "hasCafeteria", label: "Cafetería", icon: Utensils, enabled: Boolean(club?.hasCafeteria) },
    { key: "hasParking", label: "Estacionamiento", icon: Car, enabled: Boolean(club?.hasParking) },
    { key: "hasLockers", label: "Vestidores", icon: Lock, enabled: Boolean(club?.hasLockers) },
    { key: "hasShowers", label: "Regaderas", icon: ShowerHead, enabled: Boolean(club?.hasShowers) },
    { key: "hasProShop", label: "Pro shop", icon: Store, enabled: Boolean(club?.hasProShop) },
    { key: "hasLighting", label: "Iluminación", icon: Lightbulb, enabled: Boolean(club?.hasLighting) },
    { key: "hasAirConditioning", label: "A/C", icon: Snowflake, enabled: Boolean(club?.hasAirConditioning) },
    { key: "acceptsOnlineBooking", label: "Reserva online", icon: Globe, enabled: Boolean(club?.acceptsOnlineBooking) },
  ]
  const amenitiesActive = amenityItems.filter((a) => a.enabled)

  const activeTournaments = Array.isArray(club?.currentTournaments) ? club.currentTournaments : club?.activeTournaments ?? []
  const upcomingTournaments = Array.isArray(club?.upcomingTournaments) ? club.upcomingTournaments : []
  const pastTournaments = Array.isArray(club?.pastTournaments) ? club.pastTournaments : []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {isLoading ? (
          <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </section>
        ) : null}

        {!isLoading && !club ? (
          <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <p className="text-sm text-muted-foreground">{t("notFound")}</p>
          </section>
        ) : null}

        {club ? (
          <>
            <section className="border-b border-border bg-card">
              <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <div className="relative h-56 w-full">
                    <img
                      src={coverImageUrl}
                      alt={`Cover ${club.name}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = "/demo/covers/default.svg"
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                  <div className="relative -mt-10 flex flex-wrap items-end justify-between gap-4 px-5 pb-5">
                    <div className="flex items-end gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-2xl border border-border/60 bg-card shadow">
                        <img
                          src={logoUrl}
                          alt={`Logo ${club.name}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).src = "/demo/logos/default.svg"
                          }}
                        />
                      </div>
                      <div>
                        <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
                          {club.name}
                        </h1>
                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {club.city}, {club.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{t("courtsCount", { count: club.courts })}</Badge>
                      <Badge variant="outline">{club.rating.toFixed(1)} {t("rating")}</Badge>
                      {club.status === "APPROVED" ? <Badge variant="secondary">{t("verified")}</Badge> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("cards.facilities")}</p>
                        <p className="text-lg font-black">{t("courtsCount", { count: club.courts })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("cards.tournaments")}</p>
                        <p className="text-lg font-black">
                          {activeTournaments.length > 0
                            ? t("activeTournamentsCount", { count: activeTournaments.length })
                            : t("totalTournamentsCount", { count: club.totalTournaments })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("cards.community")}</p>
                        <p className="text-lg font-black">{t("playersCount", { count: formatCompactNumber(club.totalHomePlayers ?? 0, localeTag) })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("cards.rating")}</p>
                        <p className="text-lg font-black">{club.rating.toFixed(1)} / 5</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-12 lg:px-8">
              <div className="lg:col-span-8">
                <Tabs defaultValue="informacion" className="w-full">
                  <TabsList
                    className={cn(
                      "mb-6 h-auto w-full justify-start gap-8 rounded-none bg-transparent p-0",
                      "overflow-x-auto border-b border-border/60"
                    )}
                  >
                    <TabsTrigger
                      value="informacion"
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-0 pb-4 pt-3 text-sm font-semibold text-muted-foreground shadow-none",
                        "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      )}
                    >
                      Información
                    </TabsTrigger>
                    <TabsTrigger
                      value="torneos"
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-0 pb-4 pt-3 text-sm font-semibold text-muted-foreground shadow-none",
                        "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      )}
                    >
                      Torneos
                    </TabsTrigger>
                    <TabsTrigger
                      value="ranking"
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-0 pb-4 pt-3 text-sm font-semibold text-muted-foreground shadow-none",
                        "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      )}
                    >
                      Ranking
                    </TabsTrigger>
                    <TabsTrigger
                      value="canchas"
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-0 pb-4 pt-3 text-sm font-semibold text-muted-foreground shadow-none",
                        "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      )}
                    >
                      Canchas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="informacion" className="space-y-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Ficha técnica</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                        <p className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Razón social: {club.legalName || "N/D"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Teléfono: {club.phone || "N/D"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Email: {club.email || "N/D"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Web: {club.website || "N/D"}
                        </p>
                        <div className="md:col-span-2">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {club.address}, {club.city}, {club.state}
                          </p>
                        </div>
                        <p>CP: {club.postalCode || "N/D"}</p>
                        <p>Colonia: {club.neighborhood || "N/D"}</p>
                        <p>Canchas interiores: {club.indoorCourts}</p>
                        <p>Canchas exteriores: {club.outdoorCourts}</p>
                        <div className="md:col-span-2">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Superficies</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(club.courtSurfaces) && club.courtSurfaces.length > 0
                              ? club.courtSurfaces
                              : club.courtSurface
                                ? [club.courtSurface]
                                : ["N/D"]
                            ).map((surface) => (
                              <Badge key={surface} variant="outline" className="text-xs">
                                {surface}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Horario</p>
                          {Array.isArray(club.weeklySchedule) && club.weeklySchedule.length > 0 ? (
                            <div className="space-y-1">
                              {club.weeklySchedule.map((day) => (
                                <p key={day.day} className="text-xs">
                                  {day.day}: {day.closed ? "Cerrado" : day.slots.map((slot) => `${slot.start}-${slot.end}`).join(", ")}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p>{club.operatingHours || "N/D"}</p>
                          )}
                        </div>
                        <p>Rango de precio: {club.priceRange || "N/D"}</p>
                        <p>Reserva online: {club.acceptsOnlineBooking ? "Sí" : "No"}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Sobre el club</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {club.description ||
                            "Este club aún no ha publicado una descripción. Pronto podrás ver más detalles sobre sus instalaciones, servicios y torneos."}
                        </p>
                        {amenitiesActive.length > 0 ? (
                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Amenidades destacadas
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {amenitiesActive.slice(0, 6).map((item) => {
                                const Icon = item.icon
                                return (
                                  <div key={item.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                      <Icon className="h-4 w-4" />
                                    </span>
                                    <span>{item.label}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Ubicación</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                          {club.address}, {club.city}, {club.state}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {mapsHref ? (
                            <a href={mapsHref} target="_blank" rel="noreferrer">
                              <Button variant="outline" className="gap-2">
                                <MapPin className="h-4 w-4" />
                                Cómo llegar
                              </Button>
                            </a>
                          ) : null}
                          {club.phone ? (
                            <a href={`tel:${club.phone}`} rel="noreferrer">
                              <Button variant="outline" className="gap-2">
                                <Phone className="h-4 w-4" />
                                Llamar
                              </Button>
                            </a>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="torneos" className="space-y-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Torneos en curso</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {activeTournaments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Este club no tiene torneos en curso.</p>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {activeTournaments.map((t) => (
                              <div key={t.id} className="overflow-hidden rounded-xl border border-border/60 bg-background">
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold">{t.name}</p>
                                      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDate(t.startDate, localeTag)}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                      {t.status}
                                    </Badge>
                                  </div>
                                  <Link
                                    href={{ pathname: "/torneos/[id]", params: { id: String(t.id) } } as any}
                                    className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                                  >
                                    Ver torneo
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Próximos torneos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {upcomingTournaments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No hay torneos próximos publicados.</p>
                        ) : (
                          upcomingTournaments.map((t) => (
                            <div
                              key={t.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background p-4"
                            >
                              <div>
                                <p className="font-semibold">{t.name}</p>
                                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(t.startDate, localeTag)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {t.status}
                                </Badge>
                                <Link href={{ pathname: "/torneos/[id]", params: { id: String(t.id) } } as any}>
                                  <Button size="sm" variant="outline">
                                    Ver info
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Historial</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pastTournaments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aún no hay torneos finalizados.</p>
                        ) : (
                          <div className="grid gap-3">
                            {pastTournaments.slice(0, 8).map((t) => (
                              <div
                                key={t.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background p-4"
                              >
                                <div>
                                  <p className="font-semibold">{t.name}</p>
                                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(t.startDate, localeTag)}
                                  </p>
                                </div>
                                <Link href={{ pathname: "/torneos/[id]", params: { id: String(t.id) } } as any}>
                                  <Button size="sm" variant="outline">
                                    Ver resultados
                                  </Button>
                                </Link>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="ranking" className="space-y-6">
                    <Card className="border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                          <CardTitle>Top jugadores del club</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Jugadores que se dieron de alta y eligieron este club como su club principal.
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {t("playersCount", { count: formatNumber(club.totalHomePlayers ?? ranking.length, localeTag) })}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        {rankingTop.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aún no hay jugadores vinculados a este club.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <tr>
                                  <th className="px-4 py-3">#</th>
                                  <th className="px-4 py-3">Jugador</th>
                                  <th className="px-4 py-3">Puntos</th>
                                  <th className="px-4 py-3">W/L</th>
                                  <th className="px-4 py-3 text-right">Categoría</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {rankingTop.map((p, idx) => {
                                  const pos = idx + 1
                                  const hasAvatar = Boolean(p.avatarUrl)
                                  const ratio =
                                    p.played && p.played > 0 ? `${Math.round((p.wins / Math.max(p.played, 1)) * 100)}%` : "N/D"
                                  return (
                                    <tr key={p.id} className="hover:bg-muted/30">
                                      <td className="px-4 py-3">
                                        <div
                                          className={cn(
                                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black",
                                            pos === 1
                                              ? "bg-yellow-400 text-slate-900"
                                              : pos === 2
                                                ? "bg-slate-300 text-slate-900"
                                                : pos === 3
                                                  ? "bg-orange-400 text-slate-900"
                                                  : "bg-muted text-muted-foreground"
                                          )}
                                        >
                                          {pos}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 overflow-hidden rounded-full border border-border/60 bg-muted">
                                            {hasAvatar ? (
                                              <img
                                                src={p.avatarUrl as string}
                                                alt={`Avatar ${p.fullName}`}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                                                }}
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center text-xs font-black text-muted-foreground">
                                                {initialsFromName(p.fullName)}
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <p className="font-semibold">{p.fullName}</p>
                                            <p className="text-xs text-muted-foreground">{p.city}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 font-black text-primary">{formatNumber(p.points, localeTag)}</td>
                                      <td className="px-4 py-3 text-muted-foreground">
                                        {p.wins}/{p.losses} ({ratio})
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="inline-flex rounded-md bg-primary/10 px-2 py-1 text-[10px] font-black uppercase text-primary">
                                          {p.category || "N/D"}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                })}
                                <tr>
                                  <td colSpan={5} className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Mostrando Top {rankingTop.length} jugadores de {club.name}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="canchas" className="space-y-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Instalaciones</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{club.courts} canchas</p>
                            <p className="text-sm text-muted-foreground">
                              {club.indoorCourts} indoor • {club.outdoorCourts} outdoor
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {Array.isArray(club.courtSurfaces) && club.courtSurfaces.length > 0
                                ? club.courtSurfaces[0]
                                : club.courtSurface || "Superficie N/D"}
                            </Badge>
                            {club.hasLighting ? (
                              <Badge variant="secondary" className="text-[10px] uppercase">
                                Iluminación
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          {(Array.isArray(club.photos) ? club.photos : [])
                            .filter((p) => typeof p === "string")
                            .slice(0, 3)
                            .map((url, idx) => (
                              <div
                                key={`${url}-${idx}`}
                                className="group overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm"
                              >
                                <div className="relative h-44">
                                  <img
                                    src={url as string}
                                    alt={`Cancha ${idx + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                    onError={(e) => {
                                      ;(e.currentTarget as HTMLImageElement).src = "/demo/covers/default.svg"
                                    }}
                                  />
                                  <div className="absolute left-3 top-3">
                                    <Badge className="bg-black/60 text-[10px] font-black uppercase text-white" variant="secondary">
                                      Cancha {idx + 1}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                                    <div>
                                      <p className="font-black text-primary">Surface</p>
                                      <p className="text-[10px] uppercase">
                                        {Array.isArray(club.courtSurfaces) && club.courtSurfaces.length > 0
                                          ? club.courtSurfaces[0]
                                          : club.courtSurface || "N/D"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-black text-primary">Tipo</p>
                                      <p className="text-[10px] uppercase">{club.indoorCourts > 0 ? "Indoor" : "Outdoor"}</p>
                                    </div>
                                    <div>
                                      <p className="font-black text-primary">Luz</p>
                                      <p className="text-[10px] uppercase">{club.hasLighting ? "Sí" : "N/D"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-primary/5 p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-black">Gestión de reservas</p>
                              <p className="text-sm text-muted-foreground">
                                Este club puede usar WhatsApp o una plataforma externa para reservar.
                              </p>
                            </div>
                            <div className="flex w-full gap-2 md:w-auto">
                              {toWhatsappHref(club.whatsapp) ? (
                                <a className="flex-1 md:flex-none" href={toWhatsappHref(club.whatsapp) as string} target="_blank" rel="noreferrer">
                                  <Button className="w-full gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    WhatsApp
                                  </Button>
                                </a>
                              ) : null}
                              {toHref(club.website) ? (
                                <a className="flex-1 md:flex-none" href={toHref(club.website) as string} target="_blank" rel="noreferrer">
                                  <Button variant="outline" className="w-full gap-2">
                                    <Globe className="h-4 w-4" />
                                    Web
                                  </Button>
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {amenitiesActive.length > 0 ? (
                          <Card className="border-border/50">
                            <CardHeader>
                              <CardTitle>Amenidades y servicios</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                              {amenitiesActive.map((item) => {
                                const Icon = item.icon
                                return (
                                  <div
                                    key={item.key}
                                    className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background p-3 text-center"
                                  >
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                      <Icon className="h-6 w-6" />
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                                  </div>
                                )
                              })}
                            </CardContent>
                          </Card>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              <aside className="lg:col-span-4 space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Contacto y enlaces</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid gap-2">
                      {toWhatsappHref(club.whatsapp) ? (
                        <a href={toWhatsappHref(club.whatsapp) as string} target="_blank" rel="noreferrer">
                          <Button className="w-full justify-start gap-2">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </Button>
                        </a>
                      ) : null}
                      {toHref(club.website) ? (
                        <a href={toHref(club.website) as string} target="_blank" rel="noreferrer">
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <Globe className="h-4 w-4" />
                            Sitio web
                          </Button>
                        </a>
                      ) : null}
                      {mapsHref ? (
                        <a href={mapsHref} target="_blank" rel="noreferrer">
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <MapPin className="h-4 w-4" />
                            Ver en Google Maps
                          </Button>
                        </a>
                      ) : null}
                      {!toWhatsappHref(club.whatsapp) && !toHref(club.website) && !mapsHref ? (
                        <p className="text-muted-foreground">Sin enlaces publicados.</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Redes sociales</p>
                      {socialLinks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {socialLinks.map((item) => (
                            <a
                              key={item.label}
                              href={item.href || "#"}
                              target="_blank"
                              rel="noreferrer"
                              title={item.label}
                              className="inline-flex"
                            >
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 w-10 p-0 text-muted-foreground hover:text-primary"
                              >
                                <item.icon className="h-4 w-4" />
                              </Button>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Sin redes publicadas.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Jugadores destacados</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      Top 3
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ranking.slice(0, 3).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin ranking disponible aún.</p>
                    ) : (
                      ranking.slice(0, 3).map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border/60 bg-muted">
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt={`Avatar ${p.fullName}`}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    ;(e.currentTarget as HTMLImageElement).style.display = "none"
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-black text-muted-foreground">
                                  {initialsFromName(p.fullName)}
                                </div>
                              )}
                              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-background bg-primary text-[10px] font-black text-primary-foreground">
                                {idx + 1}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{p.fullName}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {p.category || "N/D"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-primary">{formatNumber(p.points, localeTag)}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Puntos</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </aside>
            </section>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
