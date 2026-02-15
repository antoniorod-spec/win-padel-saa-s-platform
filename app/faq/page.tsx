"use client"

import { useState } from "react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    category: "General",
    items: [
      {
        q: "¿WhinPadel es realmente gratis?",
        a: "Si, completamente. No hay costos de suscripcion, comisiones ocultas ni funciones bloqueadas. Todas las herramientas estan disponibles para clubes y jugadores sin costo. Nos sostenemos a traves de patrocinios de marcas deportivas.",
      },
      {
        q: "¿Para que paises esta disponible?",
        a: "WhinPadel esta disponible para clubes y jugadores de cualquier pais. Actualmente tenemos presencia principal en Mexico y Espana, pero cualquier club del mundo puede registrarse.",
      },
      {
        q: "¿Necesito descargar una app?",
        a: "No. WhinPadel funciona directamente desde el navegador de tu celular o computadora. Es una aplicacion web responsive disenada para verse y funcionar perfecto en cualquier dispositivo.",
      },
    ],
  },
  {
    category: "Para Clubes",
    items: [
      {
        q: "¿Como registro mi club?",
        a: "Haz clic en 'Registrar Club', completa los datos de tu club (nombre, direccion, canchas, horarios) y tu cuenta sera revisada por nuestro equipo. La aprobacion toma menos de 24 horas.",
      },
      {
        q: "¿Cuantos torneos puedo crear?",
        a: "Ilimitados. No hay restriccion en la cantidad de torneos, ni en el formato, ni en el numero de jugadores por torneo.",
      },
      {
        q: "¿El sistema genera los cuadros automaticamente?",
        a: "Si. Al cerrar inscripciones, el sistema ordena las parejas por ranking combinado, asigna cabezas de serie y genera automaticamente el bracket de eliminacion, los grupos o la tabla de liga segun el formato elegido.",
      },
      {
        q: "¿Como cobro las inscripciones?",
        a: "Puedes usar la pasarela de pago integrada (Stripe/MercadoPago) para que los jugadores paguen en linea, o puedes recibir el pago directamente y marcarlo como recibido manualmente en la plataforma.",
      },
      {
        q: "¿WhinPadel cobra comision sobre las inscripciones?",
        a: "No. WhinPadel no cobra comision alguna. Las unicas comisiones que aplican son las de la pasarela de pago (Stripe o MercadoPago), que son las estandar del mercado.",
      },
    ],
  },
  {
    category: "Para Jugadores",
    items: [
      {
        q: "¿Como funciona el ranking?",
        a: "Cada categoria tiene su propio ranking independiente. Acumulas puntos segun tu clasificacion en los torneos que juegas. Tu ranking se calcula con tus mejores 8 resultados de los ultimos 12 meses.",
      },
      {
        q: "¿Que pasa cuando subo de categoria?",
        a: "Al ascender, tus puntos se resetean a 0 en la nueva categoria. Empiezas desde abajo y acumulas puntos solo con torneos de tu nueva categoria. Tu historial anterior se mantiene visible en tu perfil.",
      },
      {
        q: "¿Como me inscribo a un torneo?",
        a: "Busca torneos disponibles en tu categoria y ciudad. Selecciona el torneo, elige o invita a tu pareja, paga la inscripcion y espera la confirmacion del club.",
      },
      {
        q: "¿Que es una reclamacion de categoria?",
        a: "Si crees que un jugador esta compitiendo en una categoria inferior a su nivel real, puedes reclamar desde su perfil. Si 10 o mas jugadores hacen la misma reclamacion, el caso se eleva al comite para revision.",
      },
      {
        q: "¿Puedo pertenecer a varios clubes?",
        a: "Si. Puedes estar asociado a varios clubes y jugar torneos en cualquiera de ellos. Tu ranking es unico por categoria, independientemente del club.",
      },
    ],
  },
  {
    category: "Ranking y Categorias",
    items: [
      {
        q: "¿Como se asciende de categoria?",
        a: "Hay dos formas automaticas: ganar un torneo en tu categoria (ascenso inmediato), o llegar a la final en 2 torneos consecutivos. Tambien hay revision por comite si llegas a semifinales en 3 de tus ultimos 5 torneos.",
      },
      {
        q: "¿Se puede descender de categoria?",
        a: "Si eres eliminado en primera ronda en 5 torneos consecutivos, puedes solicitar el descenso. El comite revisa tu caso y decide. Al descender, tus puntos tambien se resetean a 0.",
      },
      {
        q: "¿Los puntos expiran?",
        a: "Si. Los puntos de torneos jugados hace mas de 6 meses pierden 25% de su valor cada mes. Esto incentiva la participacion constante.",
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-primary"
      >
        <span className="pr-4 text-sm font-medium text-foreground">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200",
          open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-secondary py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <HelpCircle className="h-4 w-4" />
                Centro de Ayuda
              </div>
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                Preguntas <span className="text-primary">Frecuentes</span>
              </h1>
              <p className="mt-4 text-lg text-secondary-foreground/70">
                Encuentra respuestas rapidas a las dudas mas comunes sobre WhinPadel.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <div className="space-y-10">
              {faqs.map((section) => (
                <div key={section.category}>
                  <h2 className="mb-4 font-display text-xl font-bold uppercase text-foreground">
                    {section.category}
                  </h2>
                  <div className="rounded-xl border border-border bg-card px-6">
                    {section.items.map((faq) => (
                      <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-xl border border-border bg-muted/50 p-8 text-center">
              <h3 className="font-display text-lg font-bold text-foreground">
                ¿No encontraste tu respuesta?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Escribenos y te respondemos en menos de 24 horas.
              </p>
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/contacto">
                  <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Ir a Contacto
                  </Button>
                </Link>
                <a
                  href="https://wa.me/521XXXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
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
