"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, MapPin, Users, Trophy, Search } from "lucide-react"
import { useTournaments } from "@/hooks/use-tournaments"
import { cn } from "@/lib/utils"

export default function TorneosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [city, setCity] = useState<string | undefined>(undefined)
  
  const { data: tournamentsData, isLoading } = useTournaments({
    status: "UPCOMING",
    search: searchTerm || undefined,
    city,
  })

  const tournaments = tournamentsData?.data.data || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
              Torneos
            </h1>
            <p className="mt-2 text-muted-foreground">
              Explora y registrate en los mejores torneos de padel
            </p>
            <div className="relative mt-6 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar torneos..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">Cargando torneos...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Trophy className="mb-4 h-16 w-16 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">No se encontraron torneos</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Intenta con otra búsqueda o vuelve más tarde
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tournaments.map((t: any) => {
                const isAlmostFull = t.registeredTeams >= t.maxTeams * 0.9
                
                return (
                  <Card
                    key={t.id}
                    className="group border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-primary/40 bg-primary/10 text-primary"
                              )}
                            >
                              Cat. {t.category}
                            </Badge>
                            {isAlmostFull && (
                              <Badge className="bg-destructive/10 text-destructive">
                                Casi lleno
                              </Badge>
                            )}
                            {t.status === "ACTIVE" && (
                              <Badge className="bg-chart-4/10 text-chart-4">
                                En curso
                              </Badge>
                            )}
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
                        <div>
                          {t.prize ? (
                            <span className="font-display text-lg font-bold text-primary">{t.prize}</span>
                          ) : (
                            <span className="font-display text-lg font-bold text-primary">
                              ${t.inscriptionPrice}
                            </span>
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
