"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Trophy, ArrowRight } from "lucide-react"
import { useTournaments } from "@/hooks/use-tournaments"

export function TournamentsPreview() {
  const { data: tournamentsData } = useTournaments({ status: "UPCOMING", pageSize: 4 })
  const tournaments = tournamentsData?.data?.items || []

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold uppercase text-foreground md:text-4xl">
              Proximos Torneos
            </h2>
            <p className="mt-2 text-muted-foreground">Inscribete a los mejores torneos de padel</p>
          </div>
          <Link href="/torneos" className="hidden md:block">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {tournaments.slice(0, 4).map((t: any) => {
            const isAlmostFull = t.registeredTeams >= t.maxTeams * 0.9
            
            return (
              <Card key={t.id} className="group border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                          Cat. {t.category}
                        </Badge>
                        {isAlmostFull && (
                          <Badge className="bg-destructive/10 text-destructive">
                            Casi lleno
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 font-display text-xl font-bold text-card-foreground group-hover:text-primary transition-colors">
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
                      {new Date(t.startDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {t.city}
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
                    <span className="font-display text-lg font-bold text-primary">
                      {t.prize || `$${t.inscriptionPrice}`}
                    </span>
                    <Link href={`/torneos/${t.id}`}>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Inscribirme
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/torneos">
            <Button variant="outline" className="gap-2">
              Ver todos los torneos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
