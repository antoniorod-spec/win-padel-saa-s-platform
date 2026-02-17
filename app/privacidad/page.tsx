import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/privacidad", canonicalLocale: locale }),
  }
}

export default async function PrivacidadPage() {
  const locale = (await getLocale()) as "es" | "en"
  const lastUpdated = locale === "en" ? "Last updated: February 2026" : "Ultima actualizacion: Febrero 2026"

  const sections =
    locale === "en"
      ? [
          {
            title: "1. Information We Collect",
            body:
              "We collect information you provide directly when registering: name, email, date of birth, city, club affiliation and playing category. We also collect usage data such as tournaments played, results and statistics.",
          },
          {
            title: "2. How We Use Information",
            body:
              "We use your information to manage your account, calculate and display rankings, process tournament registrations, send relevant notifications and improve the platform.",
          },
          {
            title: "3. Public Information",
            body:
              "Your name, category, club, tournament stats and ranking position are public information visible to other users. Your email and personal contact details are not publicly visible.",
          },
          {
            title: "4. Sharing Information",
            body:
              "We do not sell or share your personal information with third parties for commercial purposes. We may share anonymized and aggregated data with sponsors for visibility reports (e.g. total number of players by city, without identifiable data).",
          },
          {
            title: "5. Security",
            body:
              "We implement technical and organizational security measures to protect your information. Passwords are stored encrypted and communications are made over HTTPS.",
          },
          {
            title: "6. Payment Processing",
            body:
              "Payments are processed by third-party providers (Stripe, MercadoPago). WhinPadel does not store credit card data or banking information.",
          },
          {
            title: "7. Your Rights",
            body:
              "You have the right to access, correct or delete your personal information. You can request deletion of your account by emailing contacto@whinpadel.com. When deleting your account, your personal data will be deleted, but historical tournament results may be kept anonymized to preserve ranking integrity.",
          },
          {
            title: "8. Cookies",
            body:
              "We use essential cookies for platform functionality (authentication, theme preferences). We do not use advertising tracking cookies.",
          },
          {
            title: "9. Contact",
            bodyPrefix: "For any questions about this policy, contact us at ",
          },
        ]
      : [
          {
            title: "1. Informacion que Recopilamos",
            body:
              "Recopilamos informacion que nos proporcionas directamente al registrarte: nombre, email, fecha de nacimiento, ciudad, club de pertenencia y categoria de juego. Tambien recopilamos datos de uso como torneos jugados, resultados y estadisticas.",
          },
          {
            title: "2. Uso de la Informacion",
            body:
              "Utilizamos tu informacion para: gestionar tu cuenta, calcular y mostrar rankings, procesar inscripciones a torneos, enviar notificaciones relevantes y mejorar la plataforma.",
          },
          {
            title: "3. Informacion Publica",
            body:
              "Tu nombre, categoria, club, estadisticas de torneos y posicion en el ranking son informacion publica visible para otros usuarios de la plataforma. Tu email y datos personales de contacto no son visibles publicamente.",
          },
          {
            title: "4. Compartir Informacion",
            body:
              "No vendemos ni compartimos tu informacion personal con terceros con fines comerciales. Podemos compartir datos anonimizados y agregados con patrocinadores para reportes de visibilidad (por ejemplo: numero total de jugadores por ciudad, sin datos identificables).",
          },
          {
            title: "5. Seguridad",
            body:
              "Implementamos medidas de seguridad tecnicas y organizativas para proteger tu informacion. Las contrasenas se almacenan encriptadas y las comunicaciones se realizan a traves de HTTPS.",
          },
          {
            title: "6. Procesamiento de Pagos",
            body:
              "Los pagos son procesados por proveedores de terceros (Stripe, MercadoPago). WhinPadel no almacena datos de tarjetas de credito ni informacion bancaria.",
          },
          {
            title: "7. Tus Derechos",
            body:
              "Tienes derecho a acceder, corregir o eliminar tu informacion personal. Puedes solicitar la eliminacion de tu cuenta enviando un email a contacto@whinpadel.com. Al eliminar tu cuenta, tus datos personales seran eliminados, pero los resultados historicos de torneos se mantendran de forma anonimizada para la integridad del ranking.",
          },
          {
            title: "8. Cookies",
            body:
              "Utilizamos cookies esenciales para el funcionamiento de la plataforma (autenticacion, preferencias de tema). No utilizamos cookies de seguimiento publicitario.",
          },
          {
            title: "9. Contacto",
            bodyPrefix: "Para cualquier consulta sobre esta politica, contactanos en ",
          },
        ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            {locale === "en" ? "Privacy Policy" : "Politica de Privacidad"}
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
