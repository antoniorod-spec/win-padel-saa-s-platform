"use client"

import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ClubPlacesPicker } from "@/components/club/club-places-picker"
import { Loader2, User, BadgeCheck, SlidersHorizontal, ArrowLeft, ArrowRight, Check } from "lucide-react"

type Props = {
  // onboarding: show "Rellenar despues" and sign-out CTA
  // profile: embedded inside dashboard; hide those CTAs
  mode: "onboarding" | "profile"
}

export function PlayerProfileForm({ mode }: Props) {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const t = useTranslations("PlayerOnboarding")

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [prefillDone, setPrefillDone] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("MX")
  const [phone, setPhone] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [sex, setSex] = useState("M")
  const [documentType, setDocumentType] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")

  const [courtPosition, setCourtPosition] = useState("")
  const [dominantHand, setDominantHand] = useState("")
  const [starShot, setStarShot] = useState("")
  const [playStyle, setPlayStyle] = useState("")
  const [preferredMatchType, setPreferredMatchType] = useState("")
  const [playsMixed, setPlaysMixed] = useState("")
  const [preferredSchedule, setPreferredSchedule] = useState("")
  const [preferredAgeRange, setPreferredAgeRange] = useState("")

  const [homeClubId, setHomeClubId] = useState<string>("")
  const [homeClubLabel, setHomeClubLabel] = useState("")
  const [homeClubLoading, setHomeClubLoading] = useState(false)

  const [partnerQuery, setPartnerQuery] = useState("")
  const [partnerResults, setPartnerResults] = useState<Array<{ id: string; fullName: string; city: string | null }>>([])
  const [preferredPartnerId, setPreferredPartnerId] = useState<string>("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [invitePhone, setInvitePhone] = useState("")
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const getAge = () => {
    if (!birthDate) return undefined
    const dob = new Date(birthDate)
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const m = now.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
    return age
  }

  const localePrefix = () => (typeof window !== "undefined" && window.location.pathname.startsWith("/en") ? "/en" : "")

  useEffect(() => {
    if (session?.user?.name) {
      const parts = session.user.name.split(" ")
      setFirstName((prev) => prev || (parts[0] ?? ""))
      setLastName((prev) => prev || (parts.slice(1).join(" ") || "Jugador"))
    }
  }, [session?.user?.name])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && session?.user?.role === "CLUB") router.push("/club")
    if (status === "authenticated" && session?.user?.role === "ADMIN") router.push("/admin")
  }, [status, session?.user?.role, router])

  // Prefill from DB when player already exists (editing).
  useEffect(() => {
    if (status !== "authenticated") return
    if (!session?.user?.id) return
    if (prefillDone) return
    let active = true

    const fillIfEmpty = <T,>(current: T, next: T | undefined | null, setter: (v: T) => void) => {
      if (next === undefined || next === null) return
      const isEmpty = typeof current === "string" ? (current as any).trim() === "" : current === undefined || current === null
      if (isEmpty) setter(next as T)
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/players?userId=${encodeURIComponent(session.user.id)}&pageSize=1`)
        const list = await res.json()
        const items = list?.success ? list?.data?.items : null
        if (!active) return
        if (!Array.isArray(items) || items.length === 0) {
          setPrefillDone(true)
          return
        }

        const playerId = String(items[0].id)
        const detailRes = await fetch(`/api/players/${encodeURIComponent(playerId)}`)
        const detail = await detailRes.json()
        if (!active) return
        if (!detailRes.ok || !detail?.success) {
          setPrefillDone(true)
          return
        }

        const p = detail.data
        fillIfEmpty(firstName, p?.firstName, setFirstName)
        fillIfEmpty(lastName, p?.lastName, setLastName)
        fillIfEmpty(city, p?.city, setCity)
        fillIfEmpty(state, p?.state, setState)
        fillIfEmpty(postalCode, p?.postalCode, setPostalCode)
        fillIfEmpty(phone, p?.phone, setPhone)
        fillIfEmpty(documentType, p?.documentType, setDocumentType)
        fillIfEmpty(documentNumber, p?.documentNumber, setDocumentNumber)
        fillIfEmpty(courtPosition, p?.courtPosition, setCourtPosition)
        fillIfEmpty(dominantHand, p?.dominantHand, setDominantHand)
        fillIfEmpty(starShot, p?.starShot, setStarShot)
        fillIfEmpty(playStyle, p?.playStyle, setPlayStyle)
        fillIfEmpty(preferredMatchType, p?.preferredMatchType, setPreferredMatchType)
        fillIfEmpty(preferredSchedule, p?.preferredSchedule, setPreferredSchedule)
        fillIfEmpty(preferredAgeRange, p?.preferredAgeRange, setPreferredAgeRange)

        if (!birthDate && p?.birthDate) {
          const d = new Date(p.birthDate)
          if (!Number.isNaN(d.getTime())) setBirthDate(d.toISOString().slice(0, 10))
        }

        if (!homeClubId && p?.homeClubId) {
          setHomeClubId(String(p.homeClubId))
          if (p?.homeClub?.name) {
            const label = `${p.homeClub.name}${p.homeClub.city ? ` - ${p.homeClub.city}` : ""}${p.homeClub.state ? ` (${p.homeClub.state})` : ""}`
            setHomeClubLabel(label)
          }
        }

        if (!preferredPartnerId && p?.preferredPartnerId) {
          setPreferredPartnerId(String(p.preferredPartnerId))
        }

        setPrefillDone(true)
      } catch {
        if (active) setPrefillDone(true)
      }
    })()

    return () => {
      active = false
    }
  }, [
    status,
    session?.user?.id,
    prefillDone,
    firstName,
    lastName,
    city,
    state,
    postalCode,
    phone,
    birthDate,
    documentType,
    documentNumber,
    courtPosition,
    dominantHand,
    starShot,
    playStyle,
    preferredMatchType,
    preferredSchedule,
    preferredAgeRange,
    homeClubId,
    preferredPartnerId,
  ])

  // Player search for optional preferred partner
  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(async () => {
      const q = partnerQuery.trim()
      if (q.length < 2) {
        if (active) setPartnerResults([])
        return
      }
      try {
        const url = new URL("/api/players/search", window.location.origin)
        url.searchParams.set("name", q)
        const res = await fetch(url.toString())
        const data = await res.json()
        if (!active) return
        const items = data?.success ? data?.data : []
        const simplified = Array.isArray(items)
          ? items.map((p: any) => ({
              id: String(p.id),
              fullName: String(p.fullName ?? ""),
              city: p.city ? String(p.city) : null,
            }))
          : []
        setPartnerResults(simplified)
      } catch {
        if (active) setPartnerResults([])
      }
    }, 300)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [partnerQuery])

  async function submit() {
    setError("")
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        type: "player",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim(),
      }

      const optionalString = (value: string) => {
        const v = value.trim()
        return v ? v : undefined
      }
      const maybeSet = (key: string, value: unknown) => {
        if (value === undefined) return
        payload[key] = value
      }

      maybeSet("state", optionalString(state))
      maybeSet("postalCode", optionalString(postalCode))
      maybeSet("country", optionalString(country))
      maybeSet("phone", optionalString(phone))
      maybeSet("birthDate", optionalString(birthDate))
      maybeSet("sex", optionalString(sex))
      maybeSet("age", getAge())
      maybeSet("documentType", optionalString(documentType))
      maybeSet("documentNumber", optionalString(documentNumber))
      maybeSet("courtPosition", optionalString(courtPosition))
      maybeSet("dominantHand", optionalString(dominantHand))
      maybeSet("starShot", optionalString(starShot))
      maybeSet("playStyle", optionalString(playStyle))
      maybeSet("preferredMatchType", optionalString(preferredMatchType))
      if (playsMixed === "si") maybeSet("playsMixed", true)
      if (playsMixed === "no") maybeSet("playsMixed", false)
      maybeSet("preferredSchedule", optionalString(preferredSchedule))
      maybeSet("preferredAgeRange", optionalString(preferredAgeRange))
      maybeSet("homeClubId", optionalString(homeClubId))
      maybeSet("preferredPartnerId", optionalString(preferredPartnerId))

      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        const fieldErrors: Record<string, string[]> | undefined = data?.details?.fieldErrors
        const formErrors: string[] | undefined = data?.details?.formErrors
        const flattened =
          fieldErrors && typeof fieldErrors === "object" ? Object.values(fieldErrors).flat().filter(Boolean) : []
        const message =
          (formErrors && formErrors.filter(Boolean).join(" • ")) ||
          (flattened.length > 0 ? flattened.join(" • ") : null) ||
          data?.error ||
          "No se pudo completar tu perfil"
        setError(message)
        return
      }

      try {
        await update?.()
      } catch {}

      setSuccess(true)
      window.setTimeout(() => {
        window.location.assign(`${localePrefix()}/jugador`)
      }, 650)
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function skipOnboarding() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/defer-profile", { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? "No se pudo omitir el onboarding")
        return
      }
      try {
        await update?.()
      } catch {}
      window.location.assign(`${localePrefix()}/jugador`)
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  function next() {
    setError("")
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError(t("requiredName"))
        return
      }
    }
    if (step === 2) {
      if (!city.trim()) {
        setError(t("requiredCity"))
        return
      }
    }
    if (step < totalSteps) setStep(step + 1)
    else submit()
  }

  function back() {
    if (step > 1) setStep(step - 1)
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t("successTitle")}</CardTitle>
          <CardDescription>{t("successDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => window.location.assign(`${localePrefix()}/jugador`)}>
            {t("successGo")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="relative">
        {mode === "onboarding" ? (
          <div className="absolute right-6 top-6">
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={skipOnboarding}>
              {t("skipButton")}
            </Button>
          </div>
        ) : null}

        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("stepOf", { step, totalSteps })}</CardDescription>
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span className={step === 1 ? "font-semibold text-foreground" : ""}>
            <User className="mr-1 inline h-3 w-3" />
            {t("basicData")}
          </span>
          <span className={step === 2 ? "font-semibold text-foreground" : ""}>
            <BadgeCheck className="mr-1 inline h-3 w-3" />
            {t("personalInfo")}
          </span>
          <span className={step === 3 ? "font-semibold text-foreground" : ""}>
            <SlidersHorizontal className="mr-1 inline h-3 w-3" />
            {t("preferences")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("firstName")}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("lastName")}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>{t("cityRequired")}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("cityPlaceholder")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("stateOptional")}</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder={t("statePlaceholder")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("postalCodeOptional")}</Label>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={t("postalCodePlaceholder")} />
            </div>

            <div className="flex flex-col gap-2 md:col-span-3">
              <ClubPlacesPicker
                label={t("homeClubOptional")}
                placeholder={t("homeClubSearchPlaceholder")}
                value={homeClubLabel}
                disabled={homeClubLoading || loading}
                onClear={() => {
                  setHomeClubId("")
                  setHomeClubLabel("")
                }}
                onSelect={async ({ placeId, place }) => {
                  setError("")
                  setHomeClubLoading(true)
                  try {
                    const res = await fetch("/api/clubs/from-place", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ placeId, place }),
                    })
                    const data = await res.json()
                    if (!res.ok) {
                      setError(data?.error ?? "No se pudo guardar el club")
                      return
                    }
                    const club = data?.data
                    setHomeClubId(String(club.id))
                    setHomeClubLabel(`${club.name} - ${club.city} (${club.state})`)
                  } catch {
                    setError("Error de conexion. Intenta de nuevo.")
                  } finally {
                    setHomeClubLoading(false)
                  }
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Numero de telefono (opcional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 444..." />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fecha de nacimiento (opcional)</Label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Genero (opcional)</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Hombre</SelectItem>
                  <SelectItem value="F">Mujer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-1">
              <Label>Documento (opcional)</Label>
              <Select value={documentType || "none"} onValueChange={(v) => setDocumentType(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  <SelectItem value="CURP">CURP</SelectItem>
                  <SelectItem value="INE">INE</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Numero de documento (opcional)</Label>
              <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Posicion en pista</Label>
              <Select value={courtPosition} onValueChange={setCourtPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu posicion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRIVE">Drive</SelectItem>
                  <SelectItem value="REVES">Reves</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Mano dominante</Label>
              <Select value={dominantHand} onValueChange={setDominantHand}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona mano dominante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DERECHA">Derecha</SelectItem>
                  <SelectItem value="IZQUIERDA">Izquierda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Golpe estrella</Label>
              <Select value={starShot} onValueChange={setStarShot}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona golpe estrella" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANDEJA">Bandeja</SelectItem>
                  <SelectItem value="VIBORA">Vibora</SelectItem>
                  <SelectItem value="REMATE">Remate</SelectItem>
                  <SelectItem value="GLOBO">Globo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Estilo de juego</Label>
              <Select value={playStyle} onValueChange={setPlayStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFENSIVO">Ofensivo</SelectItem>
                  <SelectItem value="DEFENSIVO">Defensivo</SelectItem>
                  <SelectItem value="EQUILIBRADO">Equilibrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo de partido</Label>
              <Select value={preferredMatchType} onValueChange={setPreferredMatchType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de partido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPETITIVO">Competitivo</SelectItem>
                  <SelectItem value="AMISTOSO">Amistoso</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Partidos mixtos</Label>
              <Select value={playsMixed} onValueChange={setPlaysMixed}>
                <SelectTrigger>
                  <SelectValue placeholder="Quieres jugar mixtos?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Si</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Horario preferido</Label>
              <Select value={preferredSchedule} onValueChange={setPreferredSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANANA">Manana</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOCHE">Noche</SelectItem>
                  <SelectItem value="INDIFERENTE">Indiferente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Rango de edad</Label>
              <Select value={preferredAgeRange} onValueChange={setPreferredAgeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona rango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46+">46+</SelectItem>
                  <SelectItem value="INDIFERENTE">Indiferente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 rounded-lg border border-border/60 p-4">
              <p className="mb-3 text-sm font-semibold">{t("partnerTitle")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>{t("partnerSearchLabel")}</Label>
                  <Input
                    value={partnerQuery}
                    onChange={(e) => setPartnerQuery(e.target.value)}
                    placeholder={t("partnerSearchPlaceholder")}
                  />
                  <Select value={preferredPartnerId || "none"} onValueChange={(v) => setPreferredPartnerId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una pareja (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("partnerNone")}</SelectItem>
                      {partnerResults.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.fullName} {p.city ? `- ${p.city}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>{t("inviteEmailOptional")}</Label>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t("invitePhoneOptional")}</Label>
                  <Input value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+52 444..." />
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={inviteLoading || loading}
                    onClick={async () => {
                      setInviteUrl(null)
                      setError("")
                      setInviteLoading(true)
                      try {
                        const res = await fetch("/api/players/partner-invites", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            inviteeEmail: inviteEmail.trim() || undefined,
                            inviteePhone: invitePhone.trim() || undefined,
                          }),
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          setError(data?.error ?? "No se pudo generar la invitacion")
                          return
                        }
                        setInviteUrl(data?.data?.inviteUrl ?? null)
                      } catch {
                        setError("Error de conexion. Intenta de nuevo.")
                      } finally {
                        setInviteLoading(false)
                      }
                    }}
                  >
                    {inviteLoading ? t("inviteGenerating") : t("inviteGenerate")}
                  </Button>

                  {inviteUrl ? (
                    <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
                      <p className="mb-2 font-medium">{t("inviteLinkTitle")}</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input value={inviteUrl} readOnly />
                        <Button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(inviteUrl)
                            } catch {}
                          }}
                        >
                          {t("copyLink")}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const text = encodeURIComponent(`Hola! Agrega tu cuenta de WhinPadel como mi pareja habitual: ${inviteUrl}`)
                            window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
                          }}
                        >
                          {t("sendWhatsapp")}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {error ? <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={back} disabled={step === 1 || loading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button type="button" onClick={next} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {step === totalSteps ? (
              <>
                Terminar <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {mode === "onboarding" ? (
          <Button type="button" variant="ghost" className="w-full" onClick={() => signOut({ callbackUrl: "/login" })}>
            Cancelar y salir
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

