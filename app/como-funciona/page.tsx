import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Building2, UserPlus, Trophy, Calendar, BarChart3, CreditCard,
  ArrowRight, CheckCircle, Users,
} from "lucide-react"

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-secondary py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                ¿Como funciona <span className="text-primary">WhinPadel</span>?
              </h1>
              <p className="mt-4 text-lg text-secondary-foreground/70">
                En minutos tu club esta listo para organizar torneos profesionales. Sin costo, sin complicaciones.
              </p>
            </div>
          </div>
        </section>

        {/* Para Clubes */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Building2 className="h-4 w-4" />
                Para Clubes
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                Registra tu club en 4 pasos
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1", icon: UserPlus, title: "Registrate", desc: "Crea tu cuenta como club. Agrega tu logo, direccion, canchas y horarios." },
                { step: "2", icon: Calendar, title: "Crea un torneo", desc: "Usa el wizard paso a paso: elige modalidad, categoria, formato y reglas." },
                { step: "3", icon: Users, title: "Recibe inscripciones", desc: "Los jugadores se inscriben y pagan. Tu apruebas y el sistema arma los cuadros." },
                { step: "4", icon: Trophy, title: "Publica resultados", desc: "Carga los scores, el ranking se actualiza automaticamente. Listo." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="font-display text-lg font-bold uppercase text-card-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/registro?role=club">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Registrar mi Club Gratis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Para Jugadores */}
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Users className="h-4 w-4" />
                Para Jugadores
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                Juega, compite, sube de ranking
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1", icon: UserPlus, title: "Crea tu perfil", desc: "Registrate como jugador. Indica tu categoria, ciudad y club." },
                { step: "2", icon: Calendar, title: "Busca torneos", desc: "Filtra por categoria, ciudad y formato. Inscribete con tu pareja." },
                { step: "3", icon: CreditCard, title: "Paga en linea", desc: "Paga la inscripcion de forma segura. El club confirma tu lugar." },
                { step: "4", icon: BarChart3, title: "Sube de ranking", desc: "Gana partidos, acumula puntos y asciende de categoria." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary font-display text-lg font-bold text-secondary-foreground">
                    {item.step}
                  </div>
                  <h3 className="font-display text-lg font-bold uppercase text-card-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/registro">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Registrarme como Jugador <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Todo gratis */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                Todo esto es <span className="text-primary">gratis</span>
              </h2>
              <p className="mt-3 text-muted-foreground">Sin costos ocultos. Sin funciones bloqueadas. Sin letra chica.</p>
            </div>
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
              {[
                "Torneos ilimitados",
                "Jugadores ilimitados",
                "Todos los formatos de torneo",
                "Ranking por categoria",
                "Brackets automaticos",
                "Gestion de cobros",
                "Perfiles de jugador completos",
                "Noticias y notificaciones",
                "Estadisticas del club",
                "Soporte por email y WhatsApp",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-card-foreground">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
