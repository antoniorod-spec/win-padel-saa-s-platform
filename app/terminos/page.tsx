import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            Terminos de Uso
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Ultima actualizacion: Febrero 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">1. Aceptacion de Terminos</h2>
              <p>
                Al acceder y utilizar WhinPadel ("la Plataforma"), aceptas cumplir con estos Terminos de Uso.
                Si no estas de acuerdo, por favor no utilices la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">2. Descripcion del Servicio</h2>
              <p>
                WhinPadel es una plataforma gratuita para la gestion de torneos de padel, rankings de jugadores
                y administracion de clubes. El servicio se ofrece sin costo para clubes y jugadores.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">3. Registro de Usuarios</h2>
              <p>
                Para acceder a ciertas funcionalidades, debes registrarte proporcionando informacion veraz y actualizada.
                Eres responsable de mantener la confidencialidad de tu cuenta y contrasena.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">4. Uso Aceptable</h2>
              <p>
                Te comprometes a utilizar la Plataforma de manera etica y legal. No se permite el uso fraudulento,
                la manipulacion de rankings, la creacion de cuentas falsas ni cualquier actividad que perjudique
                a otros usuarios o a la integridad del sistema.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">5. Pagos e Inscripciones</h2>
              <p>
                Los pagos de inscripcion a torneos se procesan a traves de pasarelas de pago de terceros.
                WhinPadel no cobra comision adicional sobre las inscripciones. Las politicas de reembolso
                son establecidas por cada club organizador.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">6. Propiedad Intelectual</h2>
              <p>
                Todo el contenido de la Plataforma, incluyendo diseno, logotipos, textos y software,
                es propiedad de WhinPadel o sus licenciantes y esta protegido por las leyes de propiedad intelectual.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">7. Limitacion de Responsabilidad</h2>
              <p>
                WhinPadel se proporciona "tal cual". No garantizamos disponibilidad ininterrumpida del servicio.
                No somos responsables por disputas entre jugadores, clubes u organizadores de torneos.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">8. Modificaciones</h2>
              <p>
                Nos reservamos el derecho de modificar estos terminos en cualquier momento.
                Los cambios seran publicados en esta pagina y entran en vigor inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-foreground">9. Contacto</h2>
              <p>
                Si tienes preguntas sobre estos Terminos de Uso, contactanos en{" "}
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
