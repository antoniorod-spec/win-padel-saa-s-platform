"use client"

import { useState } from "react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, MapPin, MessageCircle, Send, CheckCircle } from "lucide-react"

export default function ContactoPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrar con API de contacto (ej: Resend, SendGrid, o tu propio endpoint)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-secondary py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                <span className="text-primary">Contactanos</span>
              </h1>
              <p className="mt-4 text-lg text-secondary-foreground/70">
                ¿Tienes dudas, sugerencias o quieres registrar tu club? Estamos aqui para ayudarte.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-5">
              {/* Info */}
              <div className="lg:col-span-2">
                <h2 className="font-display text-2xl font-bold uppercase text-foreground">
                  Informacion de contacto
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Respondemos en menos de 24 horas. Si es urgente, contactanos por WhatsApp.
                </p>

                <div className="mt-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Email</h4>
                      <a href="mailto:contacto@whinpadel.com" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                        contacto@whinpadel.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">WhatsApp</h4>
                      <a
                        href="https://wa.me/524442045111"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        +52 444 204 5111
                      </a>
                      <p className="mt-0.5 text-xs text-muted-foreground">Respuesta rapida</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Ubicacion</h4>
                      <p className="text-sm text-muted-foreground">San Luis Potosi, Mexico</p>
                    </div>
                  </div>
                </div>

                {/* CTA club */}
                <div className="mt-10 rounded-xl border border-border bg-card p-6">
                  <h4 className="font-semibold text-card-foreground">¿Eres gerente de club?</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Agenda una demo personalizada y te mostramos como funciona la plataforma en 15 minutos.
                  </p>
                  <a
                    href="https://wa.me/524442045111?text=Hola%2C%20quiero%20una%20demo%20de%20WhinPadel%20para%20mi%20club"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <MessageCircle className="h-4 w-4" />
                      Agendar Demo por WhatsApp
                    </Button>
                  </a>
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-3">
                <div className="rounded-xl border border-border bg-card p-8">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="mt-4 font-display text-xl font-bold text-card-foreground">
                        Mensaje enviado
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Gracias por escribirnos. Te responderemos en menos de 24 horas.
                      </p>
                      <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                        Enviar otro mensaje
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-display text-xl font-bold uppercase text-card-foreground">
                        Envianos un mensaje
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Completa el formulario y te responderemos pronto.
                      </p>
                      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre completo</Label>
                            <Input id="nombre" placeholder="Tu nombre" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="tu@email.com" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tipo">Tipo de consulta</Label>
                          <select
                            id="tipo"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                          >
                            <option value="">Selecciona una opcion</option>
                            <option value="club">Quiero registrar mi club</option>
                            <option value="jugador">Soy jugador, tengo una duda</option>
                            <option value="patrocinio">Me interesa patrocinar</option>
                            <option value="soporte">Soporte tecnico</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="asunto">Asunto</Label>
                          <Input id="asunto" placeholder="¿En que podemos ayudarte?" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mensaje">Mensaje</Label>
                          <Textarea id="mensaje" placeholder="Cuentanos con detalle..." rows={5} required />
                        </div>
                        <Button
                          type="submit"
                          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Send className="h-4 w-4" />
                          Enviar Mensaje
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
