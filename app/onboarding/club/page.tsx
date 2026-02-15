"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Loader2, User, Building2, MapPin, Home, Wrench, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"

export default function ClubOnboardingPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
  const [address, setAddress] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [latitude, setLatitude] = useState<number | undefined>(undefined)
  const [longitude, setLongitude] = useState<number | undefined>(undefined)

  // Paso 4: Instalaciones
  const [indoorCourts, setIndoorCourts] = useState("")
  const [outdoorCourts, setOutdoorCourts] = useState("")
  const [courtSurface, setCourtSurface] = useState("")

  // Paso 5: Servicios Adicionales
  const [hasParking, setHasParking] = useState(false)
  const [hasLockers, setHasLockers] = useState(false)
  const [hasShowers, setHasShowers] = useState(false)
  const [hasCafeteria, setHasCafeteria] = useState(false)
  const [hasProShop, setHasProShop] = useState(false)
  const [hasLighting, setHasLighting] = useState(false)
  const [hasAirConditioning, setHasAirConditioning] = useState(false)
  const [operatingHours, setOperatingHours] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [acceptsOnlineBooking, setAcceptsOnlineBooking] = useState(false)
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")

  // Pre-llenar datos si ya existen
  useEffect(() => {
    if (session?.user?.name) {
      setContactName(session.user.name)
    }
    if (session?.user?.email) {
      setContactEmail(session.user.email)
    }
  }, [session])

  // Redirigir si ya tiene perfil completo
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "CLUB") {
      router.push("/club")
    }
    if (status === "unauthenticated") {
      router.push("/registro")
    }
  }, [status, session, router])

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const stepIcons = [
    { icon: User, label: "Responsable" },
    { icon: Building2, label: "Club" },
    { icon: MapPin, label: "Ubicación" },
    { icon: Home, label: "Instalaciones" },
    { icon: Wrench, label: "Servicios" },
  ]

  async function handleSubmit() {
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "club",
          // Paso 1
          contactName,
          contactPhone,
          contactEmail: contactEmail || undefined,
          contactPosition: contactPosition || undefined,
          // Paso 2
          clubName,
          legalName: legalName || undefined,
          rfc,
          clubPhone,
          clubEmail: clubEmail || undefined,
          website: website || undefined,
          // Paso 3
          country,
          state,
          city,
          address,
          postalCode: postalCode || undefined,
          latitude,
          longitude,
          // Paso 4
          indoorCourts: indoorCourts ? parseInt(indoorCourts) : 0,
          outdoorCourts: outdoorCourts ? parseInt(outdoorCourts) : 0,
          courtSurface: courtSurface || undefined,
          // Paso 5
          hasParking,
          hasLockers,
          hasShowers,
          hasCafeteria,
          hasProShop,
          hasLighting,
          hasAirConditioning,
          operatingHours: operatingHours || undefined,
          priceRange: priceRange || undefined,
          acceptsOnlineBooking,
          facebook: facebook || undefined,
          instagram: instagram || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al completar perfil")
        return
      }

      // Actualizar sesión
      await update()

      // Redirigir al dashboard
      router.push("/club")
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setError("")
    } else {
      handleSubmit()
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError("")
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      <Card className="relative z-10 w-full max-w-3xl border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Registro de Club</CardTitle>
              <CardDescription>Paso {currentStep} de {totalSteps}</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% completado
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between">
            {stepIcons.map((step, index) => {
              const stepNumber = index + 1
              const Icon = step.icon
              const isCompleted = stepNumber < currentStep
              const isCurrent = stepNumber === currentStep

              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Paso 1: Datos del Responsable */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Datos del Responsable</h3>
                <p className="text-sm text-muted-foreground">Persona de contacto principal del club</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="contact-name">
                    Nombre Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    placeholder="Juan Perez Martinez"
                    className="bg-background"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-phone">
                    Telefono <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="4441234567"
                    className="bg-background"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-email">Email (opcional)</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="juan@email.com"
                    className="bg-background"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="contact-position">Cargo/Puesto</Label>
                  <Select value={contactPosition} onValueChange={setContactPosition}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecciona un cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dueño">Dueño</SelectItem>
                      <SelectItem value="Gerente General">Gerente General</SelectItem>
                      <SelectItem value="Gerente de Operaciones">Gerente de Operaciones</SelectItem>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Coordinador Deportivo">Coordinador Deportivo</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Datos del Club */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Informacion del Club</h3>
                <p className="text-sm text-muted-foreground">Datos generales y de contacto</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="club-name">
                    Nombre del Club <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="club-name"
                    placeholder="Padel Center CDMX"
                    className="bg-background"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="legal-name">Razon Social (opcional)</Label>
                  <Input
                    id="legal-name"
                    placeholder="Deportes y Recreacion SA de CV"
                    className="bg-background"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">Solo si es diferente al nombre comercial</span>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="rfc">
                    RFC <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rfc"
                    placeholder="ABC123456XYZ"
                    className="bg-background"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    maxLength={13}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-phone">
                    Telefono del Club <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="club-phone"
                    type="tel"
                    placeholder="4449876543"
                    className="bg-background"
                    value={clubPhone}
                    onChange={(e) => setClubPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-email">Email del Club (opcional)</Label>
                  <Input
                    id="club-email"
                    type="email"
                    placeholder="info@tuclub.mx"
                    className="bg-background"
                    value={clubEmail}
                    onChange={(e) => setClubEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="website">Sitio Web (opcional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.tuclub.mx"
                    className="bg-background"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Ubicación */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Ubicacion del Club</h3>
                <p className="text-sm text-muted-foreground">Donde se encuentran tus instalaciones</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>
                    Pais <span className="text-destructive">*</span>
                  </Label>
                  <Select value={country} onValueChange={setCountry} required>
                    <SelectTrigger className="bg-background">
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
                  <Label htmlFor="state">
                    Estado/Provincia <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="state"
                    placeholder="San Luis Potosi"
                    className="bg-background"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">
                    Ciudad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="San Luis Potosi"
                    className="bg-background"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="postal-code">Codigo Postal</Label>
                  <Input
                    id="postal-code"
                    placeholder="78000"
                    className="bg-background"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Direccion Completa"
                    placeholder="Busca tu club o escribe la dirección..."
                    value={address}
                    onChange={setAddress}
                    onCoordinatesChange={(lat, lng) => {
                      setLatitude(lat)
                      setLongitude(lng)
                    }}
                    onPlaceSelected={(place) => {
                      if (place.name && !clubName) {
                        setClubName(place.name)
                      }
                    }}
                    required
                    helperText="Busca tu negocio en Google Maps o escribe manualmente"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Instalaciones */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Instalaciones</h3>
                <p className="text-sm text-muted-foreground">Informacion sobre tus canchas</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="indoor">
                    Canchas Interiores <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="indoor"
                    type="number"
                    placeholder="4"
                    className="bg-background"
                    value={indoorCourts}
                    onChange={(e) => setIndoorCourts(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="outdoor">
                    Canchas Exteriores <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="outdoor"
                    type="number"
                    placeholder="4"
                    className="bg-background"
                    value={outdoorCourts}
                    onChange={(e) => setOutdoorCourts(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="surface">Tipo de Superficie</Label>
                  <Select value={courtSurface} onValueChange={setCourtSurface}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cesped Sintetico">Cesped Sintetico</SelectItem>
                      <SelectItem value="Cristal">Cristal</SelectItem>
                      <SelectItem value="Panoramica">Panoramica</SelectItem>
                      <SelectItem value="Mixto">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 rounded-md border border-muted p-4">
                  <p className="text-sm font-medium">
                    Total de canchas:{" "}
                    <span className="text-primary">
                      {(parseInt(indoorCourts) || 0) + (parseInt(outdoorCourts) || 0)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Paso 5: Servicios Adicionales */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Servicios Adicionales</h3>
                <p className="text-sm text-muted-foreground">Que servicios ofrece tu club</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Servicios e instalaciones</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="parking" checked={hasParking} onCheckedChange={(checked) => setHasParking(!!checked)} />
                      <Label htmlFor="parking" className="font-normal cursor-pointer">
                        Estacionamiento
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="lockers" checked={hasLockers} onCheckedChange={(checked) => setHasLockers(!!checked)} />
                      <Label htmlFor="lockers" className="font-normal cursor-pointer">
                        Vestidores
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="showers" checked={hasShowers} onCheckedChange={(checked) => setHasShowers(!!checked)} />
                      <Label htmlFor="showers" className="font-normal cursor-pointer">
                        Regaderas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="cafeteria" checked={hasCafeteria} onCheckedChange={(checked) => setHasCafeteria(!!checked)} />
                      <Label htmlFor="cafeteria" className="font-normal cursor-pointer">
                        Cafeteria/Snack bar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="proshop" checked={hasProShop} onCheckedChange={(checked) => setHasProShop(!!checked)} />
                      <Label htmlFor="proshop" className="font-normal cursor-pointer">
                        Tienda de equipamiento
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="lighting" checked={hasLighting} onCheckedChange={(checked) => setHasLighting(!!checked)} />
                      <Label htmlFor="lighting" className="font-normal cursor-pointer">
                        Iluminacion nocturna
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="aircon"
                        checked={hasAirConditioning}
                        onCheckedChange={(checked) => setHasAirConditioning(!!checked)}
                      />
                      <Label htmlFor="aircon" className="font-normal cursor-pointer">
                        Aire acondicionado
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="hours">Horario de Operacion</Label>
                    <Input
                      id="hours"
                      placeholder="Lunes a Domingo 6:00 - 23:00"
                      className="bg-background"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="price">Rango de Precios</Label>
                    <Input
                      id="price"
                      placeholder="$200 - $400 por hora"
                      className="bg-background"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="online"
                      checked={acceptsOnlineBooking}
                      onCheckedChange={(checked) => setAcceptsOnlineBooking(!!checked)}
                    />
                    <Label htmlFor="online" className="font-normal cursor-pointer">
                      Aceptamos reservaciones online
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Redes Sociales (opcional)</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        placeholder="https://facebook.com/tuclub"
                        className="bg-background"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        placeholder="@tuclub"
                        className="bg-background"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atras
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep === totalSteps ? "Finalizar" : "Siguiente"}
              {currentStep < totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
