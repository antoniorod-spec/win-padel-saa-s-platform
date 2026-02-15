"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClubs } from "@/hooks/use-club"
import { Building2, MapPin, Trophy, Star } from "lucide-react"

export default function ClubesPage() {
  const { data, isLoading } = useClubs()
  const clubs = data?.data ?? []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
              Clubes Afiliados
            </h1>
            <p className="mt-2 text-muted-foreground">
              Descubre los mejores clubes de padel registrados en la plataforma
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando clubes...</p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Card key={club.id} className="group border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-card-foreground transition-colors group-hover:text-primary">
                        {club.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {club.city}
                      </p>
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
                      <span>{club.rating} / 5.0</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.floor(club.rating) ? "fill-primary text-primary" : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Verificado
                    </Badge>
                  </div>
                  <Link
                    href={`/clubes/${club.id}`}
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Ver perfil publico
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
