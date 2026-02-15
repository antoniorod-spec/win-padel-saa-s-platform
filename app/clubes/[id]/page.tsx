"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClub } from "@/hooks/use-club"
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Building2,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  MessageCircle,
} from "lucide-react"

function toHref(raw?: string | null) {
  if (!raw) return null
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
  return `https://${raw}`
}

function toWhatsappHref(raw?: string | null) {
  if (!raw) return null
  const digits = raw.replace(/\D+/g, "")
  if (!digits) return null
  return `https://wa.me/${digits}`
}

export default function ClubPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const clubId = params?.id
  const { data, isLoading } = useClub(clubId)
  const club = data?.data

  const socialLinks = [
    { label: "Facebook", href: toHref(club?.facebook), icon: Facebook },
    { label: "Instagram", href: toHref(club?.instagram), icon: Instagram },
    { label: "TikTok", href: toHref(club?.tiktok), icon: MessageCircle },
    { label: "YouTube", href: toHref(club?.youtube), icon: Youtube },
    { label: "LinkedIn", href: toHref(club?.linkedin), icon: Linkedin },
    { label: "X", href: toHref(club?.x), icon: MessageCircle },
    { label: "WhatsApp", href: toWhatsappHref(club?.whatsapp), icon: MessageCircle },
  ].filter((item) => Boolean(item.href))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {isLoading ? (
          <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <p className="text-sm text-muted-foreground">Cargando perfil del club...</p>
          </section>
        ) : null}

        {!isLoading && !club ? (
          <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <p className="text-sm text-muted-foreground">No se encontro el club.</p>
          </section>
        ) : null}

        {club ? (
          <>
            <section className="border-b border-border bg-card">
              <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
                      {club.name}
                    </h1>
                    <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {club.address}, {club.city}, {club.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{club.courts} canchas</Badge>
                    <Badge variant="outline">{club.rating.toFixed(1)} rating</Badge>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-3 lg:px-8">
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader><CardTitle>Ficha tecnica</CardTitle></CardHeader>
                <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                  <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Razon social: {club.legalName || "N/D"}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> Telefono: {club.phone || "N/D"}</p>
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email: {club.email || "N/D"}</p>
                  <p className="flex items-center gap-2"><Globe className="h-4 w-4" /> Web: {club.website || "N/D"}</p>
                  <p>CP: {club.postalCode || "N/D"}</p>
                  <p>Colonia: {club.neighborhood || "N/D"}</p>
                  <p>Canchas interiores: {club.indoorCourts}</p>
                  <p>Canchas exteriores: {club.outdoorCourts}</p>
                  <div className="md:col-span-2">
                    <p className="mb-1">Superficies:</p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(club.courtSurfaces) && club.courtSurfaces.length > 0
                        ? club.courtSurfaces
                        : club.courtSurface
                          ? [club.courtSurface]
                          : ["N/D"]
                      ).map((surface) => (
                        <Badge key={surface} variant="outline">{surface}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="mb-1">Horario semanal:</p>
                    {Array.isArray(club.weeklySchedule) && club.weeklySchedule.length > 0 ? (
                      <div className="space-y-1">
                        {club.weeklySchedule.map((day) => (
                          <p key={day.day} className="text-xs">
                            {day.day}: {day.closed ? "Cerrado" : day.slots.map((slot) => `${slot.start}-${slot.end}`).join(", ")}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p>{club.operatingHours || "N/D"}</p>
                    )}
                  </div>
                  <p>Rango de precio: {club.priceRange || "N/D"}</p>
                  <p>Reserva online: {club.acceptsOnlineBooking ? "Si" : "No"}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader><CardTitle>Contacto y redes</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {socialLinks.length > 0 ? socialLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  )) : <p className="text-muted-foreground">Sin redes publicadas.</p>}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-border/50">
                <CardHeader><CardTitle>Torneos del club</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {club.activeTournaments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Este club no tiene torneos activos.</p>
                  ) : (
                    club.activeTournaments.map((t) => (
                      <div key={t.id} className="rounded-lg border border-border/50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{t.name}</p>
                          <Badge variant="outline">{t.status}</Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(t.startDate).toLocaleDateString()}
                        </p>
                        <Link href={`/torneos/${t.id}`} className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
                          Ver torneo
                        </Link>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader><CardTitle>Novedades</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {club.news.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin novedades publicadas.</p>
                  ) : (
                    club.news.map((n) => (
                      <div key={n.id} className="rounded-lg border border-border/50 p-3">
                        <p className="font-medium">{n.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-4">{n.content}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 border-border/50">
                <CardHeader><CardTitle>Galeria</CardTitle></CardHeader>
                <CardContent>
                  {Array.isArray(club.photos) && club.photos.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      {club.photos.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt="Club media"
                          className="h-44 w-full rounded-lg border border-border object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin fotos cargadas.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
