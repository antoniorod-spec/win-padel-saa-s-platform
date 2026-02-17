"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, MapPin, MessageCircle, Send, CheckCircle } from "lucide-react"

export default function ContactoClient() {
  const t = useTranslations("ContactPage")
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
                <span className="text-primary">{t("title")}</span>
              </h1>
              <p className="mt-4 text-lg text-secondary-foreground/70">{t("intro")}</p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <h2 className="font-display text-2xl font-bold uppercase text-foreground">{t("infoHeading")}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{t("infoSubheading")}</p>

                <div className="mt-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{t("emailLabel")}</h4>
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
                      <h4 className="text-sm font-semibold text-foreground">{t("whatsAppLabel")}</h4>
                      <a
                        href="https://wa.me/524442045111"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        +52 444 204 5111
                      </a>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("fastResponse")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{t("locationLabel")}</h4>
                      <p className="text-sm text-muted-foreground">{t("locationValue")}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 rounded-xl border border-border bg-card p-6">
                  <h4 className="font-semibold text-card-foreground">{t("clubCardTitle")}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{t("clubCardDesc")}</p>
                  <a
                    href="https://wa.me/524442045111?text=Hola%2C%20quiero%20una%20demo%20de%20WhinPadel%20para%20mi%20club"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <MessageCircle className="h-4 w-4" />
                      {t("clubCardCta")}
                    </Button>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="rounded-xl border border-border bg-card p-8">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="mt-4 font-display text-xl font-bold text-card-foreground">{t("sentTitle")}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{t("sentDesc")}</p>
                      <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                        {t("sendAnother")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-display text-xl font-bold uppercase text-card-foreground">{t("formTitle")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t("formDesc")}</p>
                      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="nombre">{t("fullName")}</Label>
                            <Input id="nombre" placeholder={t("fullNamePlaceholder")} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">{t("emailLabel")}</Label>
                            <Input id="email" type="email" placeholder={t("emailPlaceholder")} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tipo">{t("typeLabel")}</Label>
                          <select
                            id="tipo"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                          >
                            <option value="">{t("typePlaceholder")}</option>
                            <option value="club">{t("typeClub")}</option>
                            <option value="jugador">{t("typePlayer")}</option>
                            <option value="patrocinio">{t("typeSponsor")}</option>
                            <option value="soporte">{t("typeSupport")}</option>
                            <option value="otro">{t("typeOther")}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="asunto">{t("subjectLabel")}</Label>
                          <Input id="asunto" placeholder={t("subjectPlaceholder")} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mensaje">{t("messageLabel")}</Label>
                          <Textarea id="mensaje" placeholder={t("messagePlaceholder")} rows={5} required />
                        </div>
                        <Button type="submit" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                          <Send className="h-4 w-4" />
                          {t("submit")}
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

