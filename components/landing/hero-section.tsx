"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, ArrowRight, Users, Calendar, BarChart3 } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.1),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 px-4 py-1.5 text-primary">
            <Trophy className="mr-2 h-3.5 w-3.5" />
            La plataforma #1 para padel competitivo
          </Badge>

          <h1 className="text-balance font-display text-4xl font-black uppercase leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Gestiona torneos.{" "}
            <span className="text-primary">Domina el ranking.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            WinPadel es la plataforma SaaS completa para clubes, jugadores y organizadores de torneos de padel.
            Rankings en tiempo real, brackets automaticos y gestion profesional.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/registro">
              <Button size="lg" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                Registrate como Jugador
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/registro?role=club">
              <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                Registra tu Club
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: Users, value: "4,280+", label: "Jugadores activos" },
              { icon: Calendar, value: "156", label: "Torneos este ano" },
              { icon: BarChart3, value: "23", label: "Clubes asociados" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-display text-2xl font-bold text-foreground md:text-3xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground md:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
