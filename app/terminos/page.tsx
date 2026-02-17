import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/terminos", canonicalLocale: locale }),
  }
}

export default async function TerminosPage() {
  const locale = (await getLocale()) as "es" | "en"
  const lastUpdated = locale === "en" ? "Last updated: February 2026" : "Ultima actualizacion: Febrero 2026"

  const sections =
    locale === "en"
      ? [
          {
            title: "1. Acceptance of Terms",
            body:
              "By accessing and using WhinPadel (the \"Platform\"), you agree to comply with these Terms of Use. If you do not agree, please do not use the Platform.",
          },
          {
            title: "2. Service Description",
            body:
              "WhinPadel is a free platform for managing padel tournaments, player rankings and club administration. The service is offered at no cost to clubs and players.",
          },
          {
            title: "3. User Registration",
            body:
              "To access certain features, you must register providing truthful and up-to-date information. You are responsible for maintaining the confidentiality of your account and password.",
          },
          {
            title: "4. Acceptable Use",
            body:
              "You agree to use the Platform ethically and legally. Fraudulent use, manipulation of rankings, creation of fake accounts, or any activity that harms other users or the integrity of the system is not permitted.",
          },
          {
            title: "5. Payments and Registrations",
            body:
              "Tournament registration payments are processed through third-party payment gateways. WhinPadel does not charge an additional commission on registrations. Refund policies are established by each organizing club.",
          },
          {
            title: "6. Intellectual Property",
            body:
              "All Platform content, including design, logos, texts and software, is the property of WhinPadel or its licensors and is protected by intellectual property laws.",
          },
          {
            title: "7. Limitation of Liability",
            body:
              "WhinPadel is provided \"as is\". We do not guarantee uninterrupted availability. We are not responsible for disputes between players, clubs or tournament organizers.",
          },
          {
            title: "8. Modifications",
            body:
              "We reserve the right to modify these terms at any time. Changes will be published on this page and take effect immediately.",
          },
          {
            title: "9. Contact",
            bodyPrefix: "If you have questions about these Terms of Use, contact us at ",
          },
        ]
      : [
          {
            title: "1. Aceptacion de Terminos",
            body:
              "Al acceder y utilizar WhinPadel (\"la Plataforma\"), aceptas cumplir con estos Terminos de Uso. Si no estas de acuerdo, por favor no utilices la Plataforma.",
          },
          {
            title: "2. Descripcion del Servicio",
            body:
              "WhinPadel es una plataforma gratuita para la gestion de torneos de padel, rankings de jugadores y administracion de clubes. El servicio se ofrece sin costo para clubes y jugadores.",
          },
          {
            title: "3. Registro de Usuarios",
            body:
              "Para acceder a ciertas funcionalidades, debes registrarte proporcionando informacion veraz y actualizada. Eres responsable de mantener la confidencialidad de tu cuenta y contrasena.",
          },
          {
            title: "4. Uso Aceptable",
            body:
              "Te comprometes a utilizar la Plataforma de manera etica y legal. No se permite el uso fraudulento, la manipulacion de rankings, la creacion de cuentas falsas ni cualquier actividad que perjudique a otros usuarios o a la integridad del sistema.",
          },
          {
            title: "5. Pagos e Inscripciones",
            body:
              "Los pagos de inscripcion a torneos se procesan a traves de pasarelas de pago de terceros. WhinPadel no cobra comision adicional sobre las inscripciones. Las politicas de reembolso son establecidas por cada club organizador.",
          },
          {
            title: "6. Propiedad Intelectual",
            body:
              "Todo el contenido de la Plataforma, incluyendo diseno, logotipos, textos y software, es propiedad de WhinPadel o sus licenciantes y esta protegido por las leyes de propiedad intelectual.",
          },
          {
            title: "7. Limitacion de Responsabilidad",
            body:
              "WhinPadel se proporciona \"tal cual\". No garantizamos disponibilidad ininterrumpida del servicio. No somos responsables por disputas entre jugadores, clubes u organizadores de torneos.",
          },
          {
            title: "8. Modificaciones",
            body:
              "Nos reservamos el derecho de modificar estos terminos en cualquier momento. Los cambios seran publicados en esta pagina y entran en vigor inmediatamente.",
          },
          {
            title: "9. Contacto",
            bodyPrefix: "Si tienes preguntas sobre estos Terminos de Uso, contactanos en ",
          },
        ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            {locale === "en" ? "Terms of Use" : "Terminos de Uso"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{lastUpdated}</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h2>
                {"body" in s ? (
                  <p>{(s as any).body}</p>
                ) : (
                  <p>
                    {(s as any).bodyPrefix}
                    <a href="mailto:contacto@whinpadel.com" className="text-primary hover:underline">
                      contacto@whinpadel.com
                    </a>
                    .
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
