import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            Politica de Privacidad
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Ultima actualizacion: Febrero 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">1. Informacion que Recopilamos</h2>
              <p>
                Recopilamos informacion que nos proporcionas directamente al registrarte: nombre, email,
                fecha de nacimiento, ciudad, club de pertenencia y categoria de juego. Tambien recopilamos
                datos de uso como torneos jugados, resultados y estadisticas.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">2. Uso de la Informacion</h2>
              <p>
                Utilizamos tu informacion para: gestionar tu cuenta, calcular y mostrar rankings,
                procesar inscripciones a torneos, enviar notificaciones relevantes y mejorar la plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">3. Informacion Publica</h2>
              <p>
                Tu nombre, categoria, club, estadisticas de torneos y posicion en el ranking son informacion
                publica visible para otros usuarios de la plataforma. Tu email y datos personales de contacto
                no son visibles publicamente.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">4. Compartir Informacion</h2>
              <p>
                No vendemos ni compartimos tu informacion personal con terceros con fines comerciales.
                Podemos compartir datos anonimizados y agregados con patrocinadores para reportes
                de visibilidad (por ejemplo: numero total de jugadores por ciudad, sin datos identificables).
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">5. Seguridad</h2>
              <p>
                Implementamos medidas de seguridad tecnicas y organizativas para proteger tu informacion.
                Las contrasenas se almacenan encriptadas y las comunicaciones se realizan a traves de HTTPS.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">6. Procesamiento de Pagos</h2>
              <p>
                Los pagos son procesados por proveedores de terceros (Stripe, MercadoPago).
                WhinPadel no almacena datos de tarjetas de credito ni informacion bancaria.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">7. Tus Derechos</h2>
              <p>
                Tienes derecho a acceder, corregir o eliminar tu informacion personal.
                Puedes solicitar la eliminacion de tu cuenta enviando un email a contacto@whinpadel.com.
                Al eliminar tu cuenta, tus datos personales seran eliminados, pero los resultados historicos
                de torneos se mantendran de forma anonimizada para la integridad del ranking.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">8. Cookies</h2>
              <p>
                Utilizamos cookies esenciales para el funcionamiento de la plataforma (autenticacion, preferencias de tema).
                No utilizamos cookies de seguimiento publicitario.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">9. Contacto</h2>
              <p>
                Para cualquier consulta sobre esta politica, contactanos en{" "}
                <a href="mailto:contacto@whinpadel.com" className="text-primary hover:underline">
                  contacto@whinpadel.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
