"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Car, Lock, ShowerHead, Utensils, Store, Lightbulb, Snowflake } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import {
  DaySchedule,
  defaultWeeklySchedule,
  WeeklyScheduleEditor,
} from "@/components/club/weekly-schedule-editor"
import { ImageUploadField } from "@/components/club/image-upload-field"
import { ClubOnboardingShell } from "@/components/onboarding/club-onboarding-shell"
import { OnboardingSectionCard } from "@/components/onboarding/onboarding-section-card"
import { cn } from "@/lib/utils"
import { buildCityKey, buildStateKey } from "@/lib/location/keys"

const surfaceOptions = ["Cesped Sintetico", "Mondo", "Cemento", "Mixta"]
const draftStorageKey = "club_onboarding_draft_v2"

const steps = [
  { id: 1, label: "Responsable" },
  { id: 2, label: "Datos del club" },
  { id: 3, label: "Ubicacion" },
  { id: 4, label: "Instalaciones" },
  { id: 5, label: "Servicios y media" },
]

export default function ClubOnboardingPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastSavedAt, setLastSavedAt] = useState("Sin cambios recientes")
  const [draftReady, setDraftReady] = useState(false)

  // Paso 1: Datos del Responsable
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPosition, setContactPosition] = useState("")

  // Paso 2: Datos del Club
  const [clubName, setClubName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [rfc, setRfc] = useState("")
  const [clubPhone, setClubPhone] = useState("")
  const [clubEmail, setClubEmail] = useState("")
  const [website, setWebsite] = useState("")

  // Paso 3: Ubicación
  const [country, setCountry] = useState("MX")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [selectedStateKey, setSelectedStateKey] = useState("")
  const [selectedCityKey, setSelectedCityKey] = useState("")
  const [locationStates, setLocationStates] = useState<string[]>([])
  const [locationCitiesByState, setLocationCitiesByState] = useState<Record<string, string[]>>({})
  const [locationStateLabels, setLocationStateLabels] = useState<Record<string, string>>({})
  const [locationCityLabels, setLocationCityLabels] = useState<Record<string, string>>({})
  const [address, setAddress] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [latitude, setLatitude] = useState<number | undefined>(undefined)
  const [longitude, setLongitude] = useState<number | undefined>(undefined)

  // Paso 4: Instalaciones
  const [indoorCourts, setIndoorCourts] = useState("")
  const [outdoorCourts, setOutdoorCourts] = useState("")
  const [courtSurfaces, setCourtSurfaces] = useState<string[]>([])

  // Paso 5: Servicios + media
  const [hasParking, setHasParking] = useState(false)
  const [hasLockers, setHasLockers] = useState(false)
  const [hasShowers, setHasShowers] = useState(false)
  const [hasCafeteria, setHasCafeteria] = useState(false)
  const [hasProShop, setHasProShop] = useState(false)
  const [hasLighting, setHasLighting] = useState(false)
  const [hasAirConditioning, setHasAirConditioning] = useState(false)
  const [operatingHours, setOperatingHours] = useState("")
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(defaultWeeklySchedule())
  const [priceRange, setPriceRange] = useState("")
  const [acceptsOnlineBooking, setAcceptsOnlineBooking] = useState(false)
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [youtube, setYoutube] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [x, setX] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [logoUrls, setLogoUrls] = useState<string[]>([])
  const [servicesText, setServicesText] = useState("")
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])

  const totalCourts = useMemo(() => {
    return (parseInt(indoorCourts, 10) || 0) + (parseInt(outdoorCourts, 10) || 0)
  }, [indoorCourts, outdoorCourts])

  const helperByStep: Record<number, { title: string; description: string; items: string[] }> = {
    1: {
      title: "Comienza con lo esencial",
      description: "Estos datos nos ayudan a contactarte y validar la administración del club.",
      items: [
        "Usa un telefono activo para notificaciones operativas.",
        "El email de contacto puede ser diferente al de acceso.",
      ],
    },
    2: {
      title: "Identidad del club",
      description: "La información fiscal y comercial da confianza al jugador.",
      items: [
        "Nombre y RFC son obligatorios para activar el perfil.",
        "Sitio web y email del club mejoran conversión en fichas públicas.",
      ],
    },
    3: {
      title: "Ubicación precisa",
      description: "La dirección impacta en búsqueda local y mapas.",
      items: [
        "Selecciona el lugar en autocompletado para guardar coordenadas.",
        "Ciudad y estado deben coincidir con tu operación real.",
      ],
    },
    4: {
      title: "Instalaciones visibles",
      description: "Los jugadores filtran por canchas y superficies.",
      items: [
        "Marca todas las superficies disponibles.",
        "Al menos una cancha debe estar registrada para continuar.",
      ],
    },
    5: {
      title: "Cierra con valor comercial",
      description: "Servicios, horarios y fotos elevan reservas e inscripciones.",
      items: [
        "Sube logo y al menos 3 fotos para mejor rendimiento de perfil.",
        "Completa horarios semanales para evitar preguntas repetidas.",
      ],
    },
  }

  function toggleSurface(surface: string) {
    setCourtSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((item) => item !== surface) : [...prev, surface]
    )
  }

  function bumpCourts(kind: "indoor" | "outdoor", delta: number) {
    if (kind === "indoor") {
      const next = Math.max(0, (parseInt(indoorCourts, 10) || 0) + delta)
      setIndoorCourts(String(next))
      return
    }
    const next = Math.max(0, (parseInt(outdoorCourts, 10) || 0) + delta)
    setOutdoorCourts(String(next))
  }

  // Cargar borrador local
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(draftStorageKey)
      if (raw) {
        const draft = JSON.parse(raw) as Record<string, unknown>
        setCurrentStep(typeof draft.currentStep === "number" ? draft.currentStep : 1)
        setContactName(typeof draft.contactName === "string" ? draft.contactName : "")
        setContactPhone(typeof draft.contactPhone === "string" ? draft.contactPhone : "")
        setContactEmail(typeof draft.contactEmail === "string" ? draft.contactEmail : "")
        setContactPosition(typeof draft.contactPosition === "string" ? draft.contactPosition : "")
        setClubName(typeof draft.clubName === "string" ? draft.clubName : "")
        setLegalName(typeof draft.legalName === "string" ? draft.legalName : "")
        setRfc(typeof draft.rfc === "string" ? draft.rfc : "")
        setClubPhone(typeof draft.clubPhone === "string" ? draft.clubPhone : "")
        setClubEmail(typeof draft.clubEmail === "string" ? draft.clubEmail : "")
        setWebsite(typeof draft.website === "string" ? draft.website : "")
        const draftCountry = typeof draft.country === "string" ? draft.country : "MX"
        const draftState = typeof draft.state === "string" ? draft.state : ""
        const draftCity = typeof draft.city === "string" ? draft.city : ""
        setCountry(draftCountry)
        setState(draftState)
        setCity(draftCity)
        setSelectedStateKey(draftState ? buildStateKey(draftCountry, draftState) : "")
        setSelectedCityKey(draftState && draftCity ? buildCityKey(draftCountry, draftState, draftCity) : "")
        setAddress(typeof draft.address === "string" ? draft.address : "")
        setPostalCode(typeof draft.postalCode === "string" ? draft.postalCode : "")
        setNeighborhood(typeof draft.neighborhood === "string" ? draft.neighborhood : "")
        setLatitude(typeof draft.latitude === "number" ? draft.latitude : undefined)
        setLongitude(typeof draft.longitude === "number" ? draft.longitude : undefined)
        setIndoorCourts(typeof draft.indoorCourts === "string" ? draft.indoorCourts : "")
        setOutdoorCourts(typeof draft.outdoorCourts === "string" ? draft.outdoorCourts : "")
        setCourtSurfaces(Array.isArray(draft.courtSurfaces) ? draft.courtSurfaces.filter((v) => typeof v === "string") : [])
        setHasParking(Boolean(draft.hasParking))
        setHasLockers(Boolean(draft.hasLockers))
        setHasShowers(Boolean(draft.hasShowers))
        setHasCafeteria(Boolean(draft.hasCafeteria))
        setHasProShop(Boolean(draft.hasProShop))
        setHasLighting(Boolean(draft.hasLighting))
        setHasAirConditioning(Boolean(draft.hasAirConditioning))
        setOperatingHours(typeof draft.operatingHours === "string" ? draft.operatingHours : "")
        setWeeklySchedule(Array.isArray(draft.weeklySchedule) && draft.weeklySchedule.length > 0 ? (draft.weeklySchedule as DaySchedule[]) : defaultWeeklySchedule())
        setPriceRange(typeof draft.priceRange === "string" ? draft.priceRange : "")
        setAcceptsOnlineBooking(Boolean(draft.acceptsOnlineBooking))
        setFacebook(typeof draft.facebook === "string" ? draft.facebook : "")
        setInstagram(typeof draft.instagram === "string" ? draft.instagram : "")
        setTiktok(typeof draft.tiktok === "string" ? draft.tiktok : "")
        setYoutube(typeof draft.youtube === "string" ? draft.youtube : "")
        setLinkedin(typeof draft.linkedin === "string" ? draft.linkedin : "")
        setX(typeof draft.x === "string" ? draft.x : "")
        setWhatsapp(typeof draft.whatsapp === "string" ? draft.whatsapp : "")
        setLogoUrls(Array.isArray(draft.logoUrls) ? draft.logoUrls.filter((v) => typeof v === "string") : [])
        setServicesText(typeof draft.servicesText === "string" ? draft.servicesText : "")
        setGalleryUrls(Array.isArray(draft.galleryUrls) ? draft.galleryUrls.filter((v) => typeof v === "string") : [])
      }
    } catch {
      // Si el borrador está dañado, se ignora y se continúa limpio.
    } finally {
      setDraftReady(true)
    }
  }, [])

  // Pre-llenar sesión
  useEffect(() => {
    if (!session) return
    if (!contactName && session.user?.name) setContactName(session.user.name)
    if (!contactEmail && session.user?.email) setContactEmail(session.user.email)
  }, [session, contactName, contactEmail])

  useEffect(() => {
    let active = true
    fetch(`/api/location/catalog?country=${encodeURIComponent(country || "MX")}`)
      .then((r) => r.json())
      .then((payload) => {
        if (!active || !payload?.success) return
        setLocationStates(Array.isArray(payload.data?.states) ? payload.data.states : [])
        setLocationCitiesByState(payload.data?.citiesByState ?? {})
        setLocationStateLabels(payload.data?.stateLabels ?? {})
        setLocationCityLabels(payload.data?.cityLabels ?? {})
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [country])

  // Guardado local del borrador
  useEffect(() => {
    if (!draftReady || typeof window === "undefined") return
    const timeout = window.setTimeout(() => {
      const payload = {
        currentStep,
        contactName,
        contactPhone,
        contactEmail,
        contactPosition,
        clubName,
        legalName,
        rfc,
        clubPhone,
        clubEmail,
        website,
        country,
        state,
        city,
        address,
        postalCode,
        neighborhood,
        latitude,
        longitude,
        indoorCourts,
        outdoorCourts,
        courtSurfaces,
        hasParking,
        hasLockers,
        hasShowers,
        hasCafeteria,
        hasProShop,
        hasLighting,
        hasAirConditioning,
        operatingHours,
        weeklySchedule,
        priceRange,
        acceptsOnlineBooking,
        facebook,
        instagram,
        tiktok,
        youtube,
        linkedin,
        x,
        whatsapp,
        logoUrls,
        servicesText,
        galleryUrls,
      }
      window.localStorage.setItem(draftStorageKey, JSON.stringify(payload))
      setLastSavedAt(`Guardado local: ${new Date().toLocaleTimeString()}`)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [
    draftReady,
    currentStep,
    contactName,
    contactPhone,
    contactEmail,
    contactPosition,
    clubName,
    legalName,
    rfc,
    clubPhone,
    clubEmail,
    website,
    country,
    state,
    city,
    address,
    postalCode,
    neighborhood,
    latitude,
    longitude,
    indoorCourts,
    outdoorCourts,
    courtSurfaces,
    hasParking,
    hasLockers,
    hasShowers,
    hasCafeteria,
    hasProShop,
    hasLighting,
    hasAirConditioning,
    operatingHours,
    weeklySchedule,
    priceRange,
    acceptsOnlineBooking,
    facebook,
    instagram,
    tiktok,
    youtube,
    linkedin,
    x,
    whatsapp,
    logoUrls,
    servicesText,
    galleryUrls,
  ])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "CLUB") {
      router.push("/club")
    }
    if (status === "unauthenticated") {
      router.push("/registro")
    }
  }, [status, session, router])

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (!contactName.trim()) return "Completa el nombre del responsable."
      if (!contactPhone.trim()) return "Completa el telefono del responsable."
    }
    if (step === 2) {
      if (!clubName.trim()) return "Completa el nombre del club."
      if (!rfc.trim()) return "El RFC es obligatorio."
      if (!clubPhone.trim()) return "Completa el telefono del club."
    }
    if (step === 3) {
      if (!country.trim() || !state.trim() || !city.trim() || !address.trim()) {
        return "Completa pais, estado, ciudad y direccion."
      }
    }
    if (step === 4) {
      if (totalCourts <= 0) return "Registra al menos una cancha para continuar."
    }
    return null
  }

  async function handleSubmit() {
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "club",
          contactName,
          contactPhone,
          contactEmail: contactEmail || undefined,
          contactPosition: contactPosition || undefined,
          clubName,
          legalName: legalName || undefined,
          rfc,
          clubPhone,
          clubEmail: clubEmail || undefined,
          website: website || undefined,
          country,
          state,
          city,
          address,
          postalCode: postalCode || undefined,
          neighborhood: neighborhood || undefined,
          latitude,
          longitude,
          indoorCourts: indoorCourts ? parseInt(indoorCourts, 10) : 0,
          outdoorCourts: outdoorCourts ? parseInt(outdoorCourts, 10) : 0,
          courtSurface: courtSurfaces[0] || undefined,
          courtSurfaces,
          hasParking,
          hasLockers,
          hasShowers,
          hasCafeteria,
          hasProShop,
          hasLighting,
          hasAirConditioning,
          operatingHours: operatingHours || undefined,
          weeklySchedule,
          priceRange: priceRange || undefined,
          acceptsOnlineBooking,
          services: servicesText.split(",").map((s) => s.trim()).filter(Boolean),
          photos: galleryUrls,
          logoUrl: logoUrls[0] || undefined,
          facebook: facebook || undefined,
          instagram: instagram || undefined,
          tiktok: tiktok || undefined,
          youtube: youtube || undefined,
          linkedin: linkedin || undefined,
          x: x || undefined,
          whatsapp: whatsapp || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al completar perfil")
        return
      }

      await update()
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey)
      }
      router.push("/club")
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    const validationMessage = validateStep(currentStep)
    if (validationMessage) {
      setError(validationMessage)
      return
    }
    setError("")

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
      return
    }
    handleSubmit()
  }

  function handleBack() {
    setError("")
    if (currentStep > 1) setCurrentStep((prev) => prev - 1)
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const helper = helperByStep[currentStep]

  return (
    <ClubOnboardingShell
      title="Registro de club"
      subtitle="Completa tu onboarding en 5 pasos con una guía clara y guardado local automático."
      currentStep={currentStep}
      totalSteps={steps.length}
      steps={steps}
      sectionTitle={steps[currentStep - 1]?.label ?? "Onboarding"}
      sectionDescription="Todos los datos se pueden ajustar luego desde tu panel de club."
      helperTitle={helper.title}
      helperDescription={helper.description}
      helperItems={helper.items}
      statusMessage={lastSavedAt}
      error={error}
      canGoBack={currentStep > 1}
      nextLabel={currentStep === steps.length ? "Finalizar registro" : "Siguiente paso"}
      isSubmitting={loading}
      onBack={handleBack}
      onNext={handleNext}
    >
      {currentStep === 1 ? (
        <div className="space-y-4">
          <OnboardingSectionCard
            title="Representante del club"
            description="Este contacto será usado para aprobaciones, soporte y notificaciones."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="contact-name">Nombre completo *</Label>
                <Input
                  id="contact-name"
                  placeholder="Ej. Laura Mendoza Herrera"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-phone">Telefono *</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="Ej. 4441234567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-email">Email de contacto</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="Ej. operaciones@club.mx"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="contact-position">Cargo</Label>
                <Select value={contactPosition} onValueChange={setContactPosition}>
                  <SelectTrigger id="contact-position">
                    <SelectValue placeholder="Selecciona un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dueño">Dueño</SelectItem>
                    <SelectItem value="Gerente General">Gerente General</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Coordinador Deportivo">Coordinador Deportivo</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </OnboardingSectionCard>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-4">
          <OnboardingSectionCard
            title="Datos comerciales y fiscales"
            description="Estos datos permiten activar el perfil y habilitar operaciones administrativas."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="club-name">Nombre del club *</Label>
                <Input
                  id="club-name"
                  placeholder="Ej. Padel Center SLP"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="legal-name">Razon social</Label>
                <Input
                  id="legal-name"
                  placeholder="Opcional si difiere del nombre comercial"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rfc">RFC *</Label>
                <Input
                  id="rfc"
                  placeholder="ABC123456XYZ"
                  maxLength={13}
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="club-phone">Telefono del club *</Label>
                <Input
                  id="club-phone"
                  type="tel"
                  placeholder="Ej. 4449876543"
                  value={clubPhone}
                  onChange={(e) => setClubPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="club-email">Email del club</Label>
                <Input
                  id="club-email"
                  type="email"
                  placeholder="Ej. info@club.mx"
                  value={clubEmail}
                  onChange={(e) => setClubEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="Ej. https://club.mx"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </OnboardingSectionCard>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="space-y-4">
          <OnboardingSectionCard
            title="Ubicacion del club"
            description="Completa dirección y geolocalización para aparecer correctamente en búsqueda."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Pais *</Label>
                <Select
                  value={country}
                  onValueChange={(value) => {
                    setCountry(value)
                    setSelectedStateKey("")
                    setSelectedCityKey("")
                    setState("")
                    setCity("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MX">Mexico</SelectItem>
                    <SelectItem value="ES">Espana</SelectItem>
                    <SelectItem value="AR">Argentina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="state">Estado/Provincia *</Label>
                <Select
                  value={selectedStateKey || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedStateKey("")
                      setSelectedCityKey("")
                      setState("")
                      setCity("")
                      return
                    }
                    setSelectedStateKey(value)
                    setSelectedCityKey("")
                    setState(locationStateLabels[value] ?? "")
                    setCity("")
                  }}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Selecciona</SelectItem>
                    {locationStates.map((key) => (
                      <SelectItem key={key} value={key}>
                        {locationStateLabels[key] ?? key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Select
                  value={selectedCityKey || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedCityKey("")
                      setCity("")
                      return
                    }
                    setSelectedCityKey(value)
                    setCity(locationCityLabels[value] ?? "")
                  }}
                  disabled={!selectedStateKey}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder={selectedStateKey ? "Selecciona" : "Selecciona estado primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Selecciona</SelectItem>
                    {(locationCitiesByState[selectedStateKey] ?? []).map((key) => (
                      <SelectItem key={key} value={key}>
                        {locationCityLabels[key] ?? key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="postal-code">Codigo postal</Label>
                <Input
                  id="postal-code"
                  placeholder="Ej. 78000"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="neighborhood">Colonia/Barrio</Label>
                <Input
                  id="neighborhood"
                  placeholder="Ej. Del Valle"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <AddressAutocomplete
                  label="Direccion completa *"
                  placeholder="Busca por negocio o por dirección"
                  value={address}
                  onChange={setAddress}
                  onCoordinatesChange={(lat, lng) => {
                    setLatitude(lat)
                    setLongitude(lng)
                  }}
                  onPlaceSelected={(place) => {
                    if (place.name && !clubName) setClubName(place.name)
                  }}
                  helperText="Si seleccionas una sugerencia, guardaremos coordenadas automáticamente."
                  required
                />
              </div>
            </div>
          </OnboardingSectionCard>
        </div>
      ) : null}

      {currentStep === 4 ? (
        <div className="space-y-4">
          <OnboardingSectionCard
            title="Canchas y superficies"
            description="Define tu capacidad operativa para filtros de jugadores y torneos."
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-4">
                  <p className="mb-2 text-sm font-medium">Canchas interiores</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md border border-border text-lg"
                      onClick={() => bumpCourts("indoor", -1)}
                    >
                      -
                    </button>
                    <Input
                      type="number"
                      min="0"
                      value={indoorCourts}
                      onChange={(e) => setIndoorCourts(e.target.value)}
                      className="text-center"
                    />
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md border border-border text-lg"
                      onClick={() => bumpCourts("indoor", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 p-4">
                  <p className="mb-2 text-sm font-medium">Canchas exteriores</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md border border-border text-lg"
                      onClick={() => bumpCourts("outdoor", -1)}
                    >
                      -
                    </button>
                    <Input
                      type="number"
                      min="0"
                      value={outdoorCourts}
                      onChange={(e) => setOutdoorCourts(e.target.value)}
                      className="text-center"
                    />
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md border border-border text-lg"
                      onClick={() => bumpCourts("outdoor", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                Total de canchas registradas: <span className="font-semibold text-primary">{totalCourts}</span>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium">Superficies disponibles</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {surfaceOptions.map((surface) => {
                    const selected = courtSurfaces.includes(surface)
                    return (
                      <button
                        key={surface}
                        type="button"
                        onClick={() => toggleSurface(surface)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-background text-foreground hover:border-primary/40"
                        )}
                      >
                        {surface}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </OnboardingSectionCard>
        </div>
      ) : null}

      {currentStep === 5 ? (
        <div className="space-y-4">
          <OnboardingSectionCard
            title="Servicios del club"
            description="Marca tus comodidades principales para mejorar la conversión del perfil."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "parking", label: "Estacionamiento", icon: Car, active: hasParking, setter: setHasParking },
                { key: "lockers", label: "Vestidores", icon: Lock, active: hasLockers, setter: setHasLockers },
                { key: "showers", label: "Regaderas", icon: ShowerHead, active: hasShowers, setter: setHasShowers },
                { key: "cafeteria", label: "Cafeteria", icon: Utensils, active: hasCafeteria, setter: setHasCafeteria },
                { key: "proshop", label: "Pro Shop", icon: Store, active: hasProShop, setter: setHasProShop },
                { key: "lighting", label: "Iluminacion", icon: Lightbulb, active: hasLighting, setter: setHasLighting },
                { key: "aircon", label: "Aire acondicionado", icon: Snowflake, active: hasAirConditioning, setter: setHasAirConditioning },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => item.setter(!item.active)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                      item.active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background text-foreground hover:border-primary/40"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </OnboardingSectionCard>

          <OnboardingSectionCard
            title="Horarios y operación"
            description="Mantén horario base y el detalle semanal por bloques."
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="hours">Horario base (legacy)</Label>
                <Input
                  id="hours"
                  placeholder="Ej. Lunes a Domingo 07:00 - 22:00"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                />
              </div>
              <WeeklyScheduleEditor value={weeklySchedule} onChange={setWeeklySchedule} />
            </div>
          </OnboardingSectionCard>

          <OnboardingSectionCard
            title="Comercial y redes"
            description="Configura pricing y canales de contacto opcionales."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="priceRange">Rango de precios</Label>
                <Input
                  id="priceRange"
                  placeholder="Ej. $200 - $450 por hora"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                />
              </div>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acceptsOnlineBooking}
                  onChange={(e) => setAcceptsOnlineBooking(e.target.checked)}
                />
                Acepta reservaciones online
              </label>
              <div className="flex flex-col gap-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" placeholder="@tuclub" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" placeholder="https://facebook.com/tuclub" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" placeholder="524441234567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="websiteSocial">Sitio web</Label>
                <Input id="websiteSocial" placeholder="https://tuclub.mx" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input id="tiktok" placeholder="https://tiktok.com/@tuclub" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input id="youtube" placeholder="https://youtube.com/@tuclub" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" placeholder="https://linkedin.com/company/tuclub" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="x">X</Label>
                <Input id="x" placeholder="https://x.com/tuclub" value={x} onChange={(e) => setX(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="servicesText">Servicios extra (coma separada)</Label>
                <Input
                  id="servicesText"
                  placeholder="Ej. fisioterapia, academia kids, torneos internos"
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                />
              </div>
            </div>
          </OnboardingSectionCard>

          <OnboardingSectionCard
            title="Identidad visual"
            description="Sube logo y galería. Recomendado: mínimo 3 fotos."
          >
            <div className="space-y-5">
              <ImageUploadField
                label="Logo del club"
                endpoint="/api/uploads/club/logo"
                value={logoUrls}
                onChange={setLogoUrls}
              />
              <ImageUploadField
                label="Galeria del club"
                endpoint="/api/uploads/club/gallery"
                multiple
                value={galleryUrls}
                onChange={setGalleryUrls}
              />
            </div>
          </OnboardingSectionCard>
        </div>
      ) : null}
    </ClubOnboardingShell>
  )
}
