import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"
import {
  Building2, UserPlus, Trophy, Calendar, BarChart3, CreditCard,
  ArrowRight, CheckCircle, Users,
} from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/como-funciona", canonicalLocale: locale }),
  }
}

export default async function ComoFuncionaPage() {
  const locale = (await getLocale()) as "es" | "en"

  const copy =
    locale === "en"
      ? {
          heroTitlePrefix: "How does",
          heroTitleBrand: "WhinPadel",
          heroTitleSuffix: "work?",
          heroIntro: "In minutes your club is ready to run professional tournaments. No cost, no hassle.",
          clubsPill: "For clubs",
          clubsHeading: "Register your club in 4 steps",
          clubsCta: "Register my club for free",
          playersPill: "For players",
          playersHeading: "Play, compete, climb the ranking",
          playersCta: "Sign up as player",
          freeHeadingPrefix: "All of this is",
          freeHeadingHighlight: "free",
          freeSubheading: "No hidden costs. No locked features. No fine print.",
        }
      : {
          heroTitlePrefix: "¿Como funciona",
          heroTitleBrand: "WhinPadel",
          heroTitleSuffix: "?",
          heroIntro: "En minutos tu club esta listo para organizar torneos profesionales. Sin costo, sin complicaciones.",
          clubsPill: "Para Clubes",
          clubsHeading: "Registra tu club en 4 pasos",
          clubsCta: "Registrar mi Club Gratis",
          playersPill: "Para Jugadores",
          playersHeading: "Juega, compite, sube de ranking",
          playersCta: "Registrarme como Jugador",
          freeHeadingPrefix: "Todo esto es",
          freeHeadingHighlight: "gratis",
          freeSubheading: "Sin costos ocultos. Sin funciones bloqueadas. Sin letra chica.",
        }

  const clubSteps =
    locale === "en"
      ? [
          { step: "1", icon: UserPlus, title: "Sign up", desc: "Create your club account. Add your logo, address, courts and schedules." },
          { step: "2", icon: Calendar, title: "Create a tournament", desc: "Use the step-by-step wizard: choose modality, category, format and rules." },
          { step: "3", icon: Users, title: "Receive registrations", desc: "Players register and pay. You approve and the system builds the draws." },
          { step: "4", icon: Trophy, title: "Publish results", desc: "Upload scores and the ranking updates automatically. Done." },
        ]
      : [
          { step: "1", icon: UserPlus, title: "Registrate", desc: "Crea tu cuenta como club. Agrega tu logo, direccion, canchas y horarios." },
          { step: "2", icon: Calendar, title: "Crea un torneo", desc: "Usa el wizard paso a paso: elige modalidad, categoria, formato y reglas." },
          { step: "3", icon: Users, title: "Recibe inscripciones", desc: "Los jugadores se inscriben y pagan. Tu apruebas y el sistema arma los cuadros." },
          { step: "4", icon: Trophy, title: "Publica resultados", desc: "Carga los scores, el ranking se actualiza automaticamente. Listo." },
        ]

  const playerSteps =
    locale === "en"
      ? [
          { step: "1", icon: UserPlus, title: "Create your profile", desc: "Sign up as a player. Set your category, city and club." },
          { step: "2", icon: Calendar, title: "Find tournaments", desc: "Filter by category, city and format. Register with your partner." },
          { step: "3", icon: CreditCard, title: "Pay online", desc: "Pay securely. The club confirms your spot." },
          { step: "4", icon: BarChart3, title: "Climb the ranking", desc: "Win matches, earn points and get promoted." },
        ]
      : [
          { step: "1", icon: UserPlus, title: "Crea tu perfil", desc: "Registrate como jugador. Indica tu categoria, ciudad y club." },
          { step: "2", icon: Calendar, title: "Busca torneos", desc: "Filtra por categoria, ciudad y formato. Inscribete con tu pareja." },
          { step: "3", icon: CreditCard, title: "Paga en linea", desc: "Paga la inscripcion de forma segura. El club confirma tu lugar." },
          { step: "4", icon: BarChart3, title: "Sube de ranking", desc: "Gana partidos, acumula puntos y asciende de categoria." },
        ]

  const freeFeatures =
    locale === "en"
      ? [
          "Unlimited tournaments",
          "Unlimited players",
          "All tournament formats",
          "Ranking by category",
          "Automatic brackets",
          "Payments management",
          "Complete player profiles",
          "News and notifications",
          "Club statistics",
          "Support via email and WhatsApp",
        ]
      : [
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
        ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-secondary py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                {copy.heroTitlePrefix} <span className="text-primary">{copy.heroTitleBrand}</span> {copy.heroTitleSuffix}
              </h1>
              <p className="mt-4 text-lg text-secondary-foreground/70">
                {copy.heroIntro}
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
                {copy.clubsPill}
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                {copy.clubsHeading}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {clubSteps.map((item) => (
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
              <Link href={{ pathname: "/registro", query: { role: "club" } }}>
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  {copy.clubsCta} <ArrowRight className="h-4 w-4" />
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
                {copy.playersPill}
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                {copy.playersHeading}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {playerSteps.map((item) => (
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
                  {copy.playersCta} <ArrowRight className="h-4 w-4" />
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
                {copy.freeHeadingPrefix} <span className="text-primary">{copy.freeHeadingHighlight}</span>
              </h2>
              <p className="mt-3 text-muted-foreground">{copy.freeSubheading}</p>
            </div>
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
              {freeFeatures.map((feat) => (
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
