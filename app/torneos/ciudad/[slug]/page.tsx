import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Link } from "@/i18n/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { normalizeLocationToken, pickBestLabel } from "@/lib/location/keys"
import { getLocale, getTranslations } from "next-intl/server"
import { buildAlternates, getLocalePrefixedPathname } from "@/lib/seo/alternates"
import { Calendar, MapPin, Users, Trophy } from "lucide-react"

// Avoid DB-heavy prerendering during `next build` (can hit max client limits).
// This page remains SEO-friendly because it is server-rendered on demand.
export const dynamic = "force-dynamic"

async function getCityContext(slug: string) {
  const clubs = await prisma.club.findMany({
    where: { tournaments: { some: {} } },
    select: { id: true, name: true, city: true, state: true, country: true },
  })

  const matching = clubs.filter((c) => normalizeLocationToken(c.city || "") === slug)
  if (matching.length === 0) return null

  const cityLabel = pickBestLabel(matching.map((c) => c.city).filter(Boolean))
  const stateLabel = pickBestLabel(matching.map((c) => c.state).filter(Boolean))
  const country = matching[0]?.country || "MX"
  const clubIds = matching.map((c) => c.id)

  return { cityLabel, stateLabel, country, clubIds, clubs: matching }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const locale = (await getLocale()) as "es" | "en"
  const ctx = await getCityContext(slug)
  if (!ctx) {
    return {
      title: "Torneos de Pádel | WhinPadel",
      robots: { index: false, follow: false },
    }
  }

  const city = ctx.cityLabel
  const title = `Torneos de Pádel en ${city} | WhinPadel`
  const description = `Explora torneos de pádel en ${city}. Filtra por fechas, modalidad y club para encontrar el siguiente torneo.`

  return {
    title,
    description,
    alternates: buildAlternates({
      pathname: "/torneos/ciudad/[slug]",
      params: { slug },
      canonicalLocale: locale,
    }),
    openGraph: {
      title,
      description,
      url: getLocalePrefixedPathname({
        pathname: "/torneos/ciudad/[slug]",
        params: { slug },
        locale,
      }),
    },
  }
}

export default async function TorneosCiudadPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const locale = (await getLocale()) as "es" | "en"
  const tr = await getTranslations("TorneosCityPage")
  const localeTag = locale === "en" ? "en-US" : "es-MX"
  const ctx = await getCityContext(slug)
  if (!ctx) notFound()

  const city = ctx.cityLabel
  const clubIds = ctx.clubIds

  // For SEO pages, default to "upcoming + in progress". Users can still use /torneos for deep filters.
  const tournaments = await prisma.tournament.findMany({
    where: {
      clubId: { in: clubIds },
      status: { in: ["OPEN", "IN_PROGRESS", "COMPLETED"] },
    },
    include: {
      club: { select: { id: true, name: true, city: true, state: true } },
      modalities: { include: { _count: { select: { registrations: true } } } },
    },
    orderBy: [{ startDate: "asc" }],
    take: 200,
  })

  const items = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    clubId: t.clubId,
    clubName: t.club.name,
    city: t.club.city,
    state: t.club.state,
    startDate: t.startDate,
    endDate: t.endDate,
    category: t.category,
    format: t.format,
    prize: t.prize,
    posterUrl: t.posterUrl,
    logoUrl: t.logoUrl,
    inscriptionPrice: Number(t.inscriptionPrice),
    type: t.type,
    maxTeams: t.maxTeams,
    status: t.status,
    modalities: t.modalities.map((m) => `${m.modality} ${m.category}`),
    registeredTeams: t.modalities.reduce((sum, m) => sum + m._count.registrations, 0),
  }))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
              {tr("title", { city })}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {tr("subtitle", { city })}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link href="/torneos">
                <Button variant="outline" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  {tr("viewAll")}
                </Button>
              </Link>
              <Badge variant="secondary" className="text-xs">
                {tr("tournamentsCount", { count: items.length })}
              </Badge>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {items.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {tr("empty")}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => {
                const isAlmostFull = item.registeredTeams >= item.maxTeams * 0.9
                const posterUrl =
                  (typeof item.posterUrl === "string" && item.posterUrl.trim() ? item.posterUrl.trim() : null) ||
                  (typeof item.logoUrl === "string" && item.logoUrl.trim() ? item.logoUrl.trim() : null) ||
                  "/demo/covers/default.svg"
                return (
                  <Card key={item.id} className="group border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                    <div className="relative overflow-hidden rounded-t-lg border-b border-border/50">
                      <img
                        src={posterUrl}
                        alt={`Cartel ${item.name}`}
                        className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                              {item.type} • {item.format}
                            </Badge>
                            {item.status === "OPEN" ? <Badge variant="secondary">{tr("statusOpen")}</Badge> : null}
                            {item.status === "IN_PROGRESS" ? <Badge className="bg-chart-4/10 text-chart-4">{tr("statusInProgress")}</Badge> : null}
                            {item.status === "COMPLETED" ? (
                              <Badge className="bg-muted text-muted-foreground">{tr("statusCompleted")}</Badge>
                            ) : null}
                            {isAlmostFull ? <Badge className="bg-destructive/10 text-destructive">{tr("almostFull")}</Badge> : null}
                          </div>
                          <h3 className="mt-2 font-display text-xl font-bold text-card-foreground transition-colors group-hover:text-primary">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.clubName}</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Trophy className="h-6 w-6 text-primary" />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(item.startDate).toLocaleDateString(localeTag)} - {new Date(item.endDate).toLocaleDateString(localeTag)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.city}{item.state ? `, ${item.state}` : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {tr("teamsCount", { registered: item.registeredTeams, max: item.maxTeams })}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.modalities.map((m) => (
                          <Badge key={m} variant="secondary" className="text-[10px] font-medium">
                            {m}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                        <div>
                          {item.prize ? (
                            <span className="font-display text-lg font-bold text-primary">{item.prize}</span>
                          ) : (
                            <span className="font-display text-lg font-bold text-primary">${item.inscriptionPrice}</span>
                          )}
                        </div>
                        <Link href={{ pathname: "/torneos/[id]", params: { id: String(item.id) } } as any}>
                          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {tr("viewTournament")}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

