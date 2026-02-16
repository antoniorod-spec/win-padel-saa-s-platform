import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { normalizeLocationToken, pickBestLabel } from "@/lib/location/keys"
import { Calendar, MapPin, Users, Trophy } from "lucide-react"

export async function generateStaticParams() {
  const clubs = await prisma.club.findMany({
    where: { tournaments: { some: {} } },
    select: { city: true },
  })
  const slugs = Array.from(
    new Set(
      clubs
        .map((c) => normalizeLocationToken(c.city || ""))
        .filter(Boolean)
    )
  )
  return slugs.map((slug) => ({ slug }))
}

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
    alternates: {
      canonical: `/torneos/ciudad/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/torneos/ciudad/${slug}`,
    },
  }
}

export default async function TorneosCiudadPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
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
              Torneos de Pádel en {city}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Consulta torneos disponibles y próximos en {city}. Para filtros avanzados, usa el directorio general.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link href="/torneos">
                <Button variant="outline" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Ver todos los torneos
                </Button>
              </Link>
              <Badge variant="secondary" className="text-xs">
                {items.length} torneos
              </Badge>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {items.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No hay torneos para esta ciudad por ahora.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((t) => {
                const isAlmostFull = t.registeredTeams >= t.maxTeams * 0.9
                return (
                  <Card key={t.id} className="group border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                              {t.type} • {t.format}
                            </Badge>
                            {t.status === "OPEN" ? <Badge variant="secondary">Inscripciones</Badge> : null}
                            {t.status === "IN_PROGRESS" ? <Badge className="bg-chart-4/10 text-chart-4">En curso</Badge> : null}
                            {t.status === "COMPLETED" ? (
                              <Badge className="bg-muted text-muted-foreground">Finalizado</Badge>
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
                        {t.modalities.map((m) => (
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
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

