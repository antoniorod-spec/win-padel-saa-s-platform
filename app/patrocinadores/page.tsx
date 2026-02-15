import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Trophy, Users, Eye, BarChart3, Globe, Megaphone,
  ArrowRight, Star, Target, CheckCircle, MessageCircle,
} from "lucide-react"

export default function PatrocinadoresPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-secondary py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.1),transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Megaphone className="h-4 w-4" />
                Para Marcas y Empresas
              </div>
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                Conecta tu marca con la comunidad de{" "}
                <span className="text-primary">padel mas activa</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-secondary-foreground/70">
                Patrocina torneos, gana visibilidad y llega directamente a miles de jugadores
                apasionados por el padel. Tu marca donde los jugadores compiten.
              </p>
              <div className="mt-8">
                <Link href="/contacto">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Quiero Patrocinar <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Por que patrocinar */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                ¿Por que patrocinar en WhinPadel?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Visibilidad directa ante una audiencia comprometida y en crecimiento.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, title: "Audiencia Comprometida", desc: "Jugadores activos que compiten regularmente, visitan la plataforma frecuentemente y estan inmersos en el ecosistema del padel." },
                { icon: Eye, title: "Visibilidad Contextual", desc: "Tu marca aparece donde los jugadores estan mas atentos: en los torneos, brackets, resultados y paginas de ranking." },
                { icon: Target, title: "Segmentacion Precisa", desc: "Patrocina torneos por ciudad, categoria o modalidad. Llega exactamente al publico que te interesa." },
                { icon: BarChart3, title: "Metricas Reales", desc: "Reportes de visibilidad con datos reales: impresiones, clics, jugadores alcanzados por torneo y region." },
                { icon: Globe, title: "Presencia Multi-Ciudad", desc: "Una sola asociacion te da presencia en torneos de multiples ciudades y paises sin negociar club por club." },
                { icon: Star, title: "Asociacion con Comunidad", desc: "Tu marca se asocia con la competencia sana, la comunidad y el crecimiento del padel. Valores positivos que refuerzan tu imagen." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold uppercase text-card-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modalidades */}
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                Modalidades de Patrocinio
              </h2>
              <p className="mt-3 text-muted-foreground">
                Opciones flexibles que se adaptan a tus objetivos y presupuesto.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Torneo */}
              <div className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Trophy className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-card-foreground">
                  Patrocinio de Torneo
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tu marca como patrocinador oficial de torneos.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Logo en la pagina del torneo",
                    "Logo en el bracket / cuadro",
                    "Mencion en notificaciones",
                    "Banner en resultados",
                    "Presencia en el rol de partidos",
                  ].map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{i}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ranking - Popular */}
              <div className="rounded-xl border-2 border-primary bg-card p-8 shadow-lg">
                <div className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Mas Popular
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-card-foreground">
                  Patrocinio de Ranking
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Asocia tu marca a una categoria o modalidad completa.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Todo lo del Patrocinio de Torneo",
                    "Logo permanente en pagina de ranking",
                    "\"Ranking patrocinado por [Marca]\"",
                    "Presencia en perfil de jugadores",
                    "Banner en la landing publica",
                    "Reportes mensuales de visibilidad",
                  ].map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{i}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global */}
              <div className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Globe className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-card-foreground">
                  Patrocinio Global
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Maxima visibilidad en toda la plataforma.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Todo lo del Patrocinio de Ranking",
                    "Logo en el navbar de la plataforma",
                    "\"Powered by [Marca]\" en la app",
                    "Acceso a datos anonimizados de uso",
                    "Co-branding en materiales",
                    "Eventos exclusivos con jugadores top",
                  ].map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="rounded-2xl border border-border bg-secondary p-12 text-center">
              <h2 className="font-display text-3xl font-bold uppercase text-secondary-foreground">
                ¿Listo para llevar tu marca al{" "}
                <span className="text-primary">mundo del padel</span>?
              </h2>
              <p className="mt-4 text-secondary-foreground/70">
                Contactanos y disenamos un plan de patrocinio a la medida de tus objetivos.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/contacto">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Contactar al equipo comercial <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://wa.me/524442045111?text=Hola%2C%20me%20interesa%20patrocinar%20en%20WhinPadel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Directo
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
