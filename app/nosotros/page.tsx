import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Target, Heart, Globe } from "lucide-react"

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-secondary py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Heart className="h-4 w-4" />
                Nuestra Historia
              </div>
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                Creemos que el padel merece{" "}
                <span className="text-primary">herramientas profesionales</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-secondary-foreground/70">
                Somos jugadores y profesionales de tecnologia apasionados por el padel. 
                Creamos WhinPadel porque vimos que los clubes necesitaban una plataforma 
                moderna para organizar torneos sin las complicaciones de siempre.
              </p>
            </div>
          </div>
        </section>

        {/* Mision / Vision / Valores */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: "Nuestra Mision",
                  desc: "Democratizar la gestion de torneos de padel ofreciendo una plataforma profesional, gratuita y accesible para clubes de todos los tamanos en Latinoamerica y Espana.",
                },
                {
                  icon: Globe,
                  title: "Nuestra Vision",
                  desc: "Convertirnos en la plataforma de referencia para la comunidad de padel competitivo, conectando jugadores, clubes y organizadores en un ecosistema unificado.",
                },
                {
                  icon: Heart,
                  title: "Nuestros Valores",
                  desc: "Transparencia en los rankings, accesibilidad para todos, innovacion constante y pasion genuina por hacer crecer la comunidad del padel.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold uppercase text-card-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por que gratis */}
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                ¿Por que es <span className="text-primary">100% gratis</span>?
              </h2>
              <p className="mt-3 text-muted-foreground">
                No es un modelo freemium con funciones bloqueadas. Es una decision consciente.
              </p>
            </div>
            <div className="mt-12 space-y-6">
              {[
                {
                  num: "1",
                  title: "El padel crece cuando los clubes crecen",
                  desc: "Si los clubes tienen mejores herramientas, organizan mas torneos, atraen mas jugadores y el deporte crece. Todos ganamos.",
                },
                {
                  num: "2",
                  title: "Las barreras de costo no deberian existir",
                  desc: "Un club pequeno con 2 canchas merece las mismas herramientas que uno con 20. La tecnologia debe ser un igualador, no un diferenciador.",
                },
                {
                  num: "3",
                  title: "Nos sostenemos con patrocinios",
                  desc: "Marcas deportivas y empresas pueden patrocinar torneos y tener visibilidad en la plataforma. Asi el costo no recae en clubes ni jugadores.",
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 rounded-lg border border-border bg-card p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
                    {item.num}
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{item.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compromiso */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                  Comprometidos con la comunidad
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  WhinPadel nace de la frustracion de organizar torneos con hojas de calculo y 
                  WhatsApp. Sabemos lo que es porque lo vivimos como jugadores. Por eso construimos 
                  la plataforma que siempre quisimos tener.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Cada funcion que agregamos esta pensada desde la experiencia real de organizar 
                  y jugar torneos. No somos una empresa de software que decidio hacer algo de padel; 
                  somos gente de padel que sabe hacer software.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "100%", label: "Gratuito" },
                  { value: "5+", label: "Formatos de torneo" },
                  { value: "16", label: "Categorias con ranking" },
                  { value: "24/7", label: "Plataforma disponible" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-card p-6 text-center">
                    <div className="font-display text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
