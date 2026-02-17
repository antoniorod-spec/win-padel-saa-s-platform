import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"
import {
  Trophy, Users, Eye, BarChart3, Globe, Megaphone,
  ArrowRight, Star, Target, CheckCircle, MessageCircle,
} from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/patrocinadores", canonicalLocale: locale }),
  }
}

export default async function PatrocinadoresPage() {
  const locale = (await getLocale()) as "es" | "en"

  const copy =
    locale === "en"
      ? {
          pill: "For brands & companies",
          title1: "Connect your brand with the",
          titleHighlight: "most active padel community",
          intro:
            "Sponsor tournaments, gain visibility and reach thousands of players passionate about padel. Put your brand where players compete.",
          heroCta: "I want to sponsor",
          whyHeading: "Why sponsor on WhinPadel?",
          whySubheading: "Direct visibility to a committed and growing audience.",
          modesHeading: "Sponsorship options",
          modesSubheading: "Flexible options that fit your goals and budget.",
          tournamentMode: "Tournament sponsorship",
          tournamentModeDesc: "Your brand as the official sponsor of a tournament.",
          rankingModePopular: "Most popular",
          rankingMode: "Ranking sponsorship",
          rankingModeDesc: "Associate your brand with an entire category or modality.",
          globalMode: "Global sponsorship",
          globalModeDesc: "Maximum visibility across the entire platform.",
          ctaHeading1: "Ready to take your brand into the",
          ctaHeadingHighlight: "padel world",
          ctaDesc: "Contact us and we'll design a sponsorship plan tailored to your goals.",
          ctaPrimary: "Contact sales team",
          whatsAppDirect: "WhatsApp",
        }
      : {
          pill: "Para Marcas y Empresas",
          title1: "Conecta tu marca con la comunidad de",
          titleHighlight: "padel mas activa",
          intro:
            "Patrocina torneos, gana visibilidad y llega directamente a miles de jugadores apasionados por el padel. Tu marca donde los jugadores compiten.",
          heroCta: "Quiero Patrocinar",
          whyHeading: "¿Por que patrocinar en WhinPadel?",
          whySubheading: "Visibilidad directa ante una audiencia comprometida y en crecimiento.",
          modesHeading: "Modalidades de Patrocinio",
          modesSubheading: "Opciones flexibles que se adaptan a tus objetivos y presupuesto.",
          tournamentMode: "Patrocinio de Torneo",
          tournamentModeDesc: "Tu marca como patrocinador oficial de torneos.",
          rankingModePopular: "Mas Popular",
          rankingMode: "Patrocinio de Ranking",
          rankingModeDesc: "Asocia tu marca a una categoria o modalidad completa.",
          globalMode: "Patrocinio Global",
          globalModeDesc: "Maxima visibilidad en toda la plataforma.",
          ctaHeading1: "¿Listo para llevar tu marca al",
          ctaHeadingHighlight: "mundo del padel",
          ctaDesc: "Contactanos y disenamos un plan de patrocinio a la medida de tus objetivos.",
          ctaPrimary: "Contactar al equipo comercial",
          whatsAppDirect: "WhatsApp Directo",
        }

  const whyItems =
    locale === "en"
      ? [
          {
            icon: Users,
            title: "Engaged audience",
            desc: "Active players who compete regularly, visit the platform often and are immersed in the padel ecosystem.",
          },
          {
            icon: Eye,
            title: "Contextual visibility",
            desc: "Your brand appears where players are most attentive: tournaments, brackets, results and ranking pages.",
          },
          {
            icon: Target,
            title: "Precise targeting",
            desc: "Sponsor tournaments by city, category or modality. Reach exactly the audience you care about.",
          },
          {
            icon: BarChart3,
            title: "Real metrics",
            desc: "Visibility reports with real data: impressions, clicks and players reached by tournament and region.",
          },
          {
            icon: Globe,
            title: "Multi-city presence",
            desc: "One partnership gives you presence across multiple cities and countries without negotiating club by club.",
          },
          {
            icon: Star,
            title: "Community association",
            desc: "Associate your brand with healthy competition, community and the growth of padel. Positive values that strengthen your image.",
          },
        ]
      : [
          {
            icon: Users,
            title: "Audiencia Comprometida",
            desc: "Jugadores activos que compiten regularmente, visitan la plataforma frecuentemente y estan inmersos en el ecosistema del padel.",
          },
          {
            icon: Eye,
            title: "Visibilidad Contextual",
            desc: "Tu marca aparece donde los jugadores estan mas atentos: en los torneos, brackets, resultados y paginas de ranking.",
          },
          {
            icon: Target,
            title: "Segmentacion Precisa",
            desc: "Patrocina torneos por ciudad, categoria o modalidad. Llega exactamente al publico que te interesa.",
          },
          {
            icon: BarChart3,
            title: "Metricas Reales",
            desc: "Reportes de visibilidad con datos reales: impresiones, clics, jugadores alcanzados por torneo y region.",
          },
          {
            icon: Globe,
            title: "Presencia Multi-Ciudad",
            desc: "Una sola asociacion te da presencia en torneos de multiples ciudades y paises sin negociar club por club.",
          },
          {
            icon: Star,
            title: "Asociacion con Comunidad",
            desc: "Tu marca se asocia con la competencia sana, la comunidad y el crecimiento del padel. Valores positivos que refuerzan tu imagen.",
          },
        ]

  const tournamentModeBullets =
    locale === "en"
      ? [
          "Logo on the tournament page",
          "Logo on the bracket / draw",
          "Mention in notifications",
          "Banner on results",
          "Presence on match schedule",
        ]
      : [
          "Logo en la pagina del torneo",
          "Logo en el bracket / cuadro",
          "Mencion en notificaciones",
          "Banner en resultados",
          "Presencia en el rol de partidos",
        ]

  const rankingModeBullets =
    locale === "en"
      ? [
          "Everything in Tournament sponsorship",
          "Permanent logo on ranking page",
          "\"Ranking sponsored by [Brand]\"",
          "Presence on player profiles",
          "Banner on the public landing",
          "Monthly visibility reports",
        ]
      : [
          "Todo lo del Patrocinio de Torneo",
          "Logo permanente en pagina de ranking",
          "\"Ranking patrocinado por [Marca]\"",
          "Presencia en perfil de jugadores",
          "Banner en la landing publica",
          "Reportes mensuales de visibilidad",
        ]

  const globalModeBullets =
    locale === "en"
      ? [
          "Everything in Ranking sponsorship",
          "Logo in the platform navbar",
          "\"Powered by [Brand]\" in the app",
          "Access to anonymized usage data",
          "Co-branding on materials",
          "Exclusive events with top players",
        ]
      : [
          "Todo lo del Patrocinio de Ranking",
          "Logo en el navbar de la plataforma",
          "\"Powered by [Marca]\" en la app",
          "Acceso a datos anonimizados de uso",
          "Co-branding en materiales",
          "Eventos exclusivos con jugadores top",
        ]

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
                {copy.pill}
              </div>
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                {copy.title1}{" "}
                <span className="text-primary">{copy.titleHighlight}</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-secondary-foreground/70">
                {copy.intro}
              </p>
              <div className="mt-8">
                <Link href="/contacto">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    {copy.heroCta} <ArrowRight className="h-4 w-4" />
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
                {copy.whyHeading}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {copy.whySubheading}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {whyItems.map((item) => (
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
                {copy.modesHeading}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {copy.modesSubheading}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Torneo */}
              <div className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Trophy className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-card-foreground">
                  {copy.tournamentMode}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.tournamentModeDesc}
                </p>
                <div className="mt-6 space-y-3">
                  {tournamentModeBullets.map((i) => (
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
                  {copy.rankingModePopular}
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-card-foreground">
                  {copy.rankingMode}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.rankingModeDesc}
                </p>
                <div className="mt-6 space-y-3">
                  {rankingModeBullets.map((i) => (
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
                  {copy.globalMode}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.globalModeDesc}
                </p>
                <div className="mt-6 space-y-3">
                  {globalModeBullets.map((i) => (
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
                {copy.ctaHeading1}{" "}
                <span className="text-primary">{copy.ctaHeadingHighlight}</span>?
              </h2>
              <p className="mt-4 text-secondary-foreground/70">
                {copy.ctaDesc}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/contacto">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    {copy.ctaPrimary} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://wa.me/524442045111?text=Hola%2C%20me%20interesa%20patrocinar%20en%20WhinPadel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {copy.whatsAppDirect}
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
