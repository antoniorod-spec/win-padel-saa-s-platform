import { Card, CardContent } from "@/components/ui/card"
import {
  Trophy,
  BarChart3,
  Calendar,
  Users,
  CreditCard,
  Shield,
} from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Gestion de Torneos",
    description: "Crea torneos con wizard paso a paso. Liga, eliminacion directa, round robin o express. Configura categorias, formatos y reglas.",
  },
  {
    icon: BarChart3,
    title: "Ranking en Tiempo Real",
    description: "Algoritmo profesional de puntos con mejores 8 resultados en 12 meses. Ascensos y descensos automaticos por rendimiento.",
  },
  {
    icon: Trophy,
    title: "Brackets Automaticos",
    description: "Genera cuadros de eliminacion y grupos automaticamente. Cabezas de serie por ranking. Resultados en tiempo real.",
  },
  {
    icon: Users,
    title: "Perfiles de Jugador",
    description: "Estadisticas completas, historial de torneos, grafica de evolucion y sistema de reclamacion de categorias.",
  },
  {
    icon: CreditCard,
    title: "Gestion de Cobros",
    description: "Inscripciones online, confirmacion de pagos, integracion con pasarelas. Todo el flujo financiero del torneo.",
  },
  {
    icon: Shield,
    title: "Admin Profesional",
    description: "Panel completo para clubes y super admin. Metricas, reportes, gestion de jugadores y comite de categorias.",
  },
]

export function FeaturesSection() {
  return (
    <section className="border-t border-border/50 bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-bold uppercase text-foreground md:text-4xl">
            Todo lo que necesitas para el padel competitivo
          </h2>
          <p className="mt-4 text-muted-foreground">
            Una plataforma integral que conecta clubes, jugadores y organizadores.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-card-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
