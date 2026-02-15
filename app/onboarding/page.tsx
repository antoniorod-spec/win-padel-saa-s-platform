"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Trophy, User, Building2, Loader2 } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Player fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [sex, setSex] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [age, setAge] = useState("")

  // Club fields
  const [clubName, setClubName] = useState("")
  const [clubCity, setClubCity] = useState("")
  const [clubAddress, setClubAddress] = useState("")
  const [clubLatitude, setClubLatitude] = useState<number | undefined>(undefined)
  const [clubLongitude, setClubLongitude] = useState<number | undefined>(undefined)
  const [clubRfc, setClubRfc] = useState("")
  const [indoorCourts, setIndoorCourts] = useState("")
  const [outdoorCourts, setOutdoorCourts] = useState("")
  const [courts, setCourts] = useState("") // Deprecated

  // Pre-llenar nombre si viene de Google
  useEffect(() => {
    if (session?.user?.name) {
      const nameParts = session.user.name.split(" ")
      if (nameParts.length >= 2) {
        setFirstName(nameParts[0])
        setLastName(nameParts.slice(1).join(" "))
      } else {
        setFirstName(session.user.name)
      }
      setClubName(session.user.name)
    }
  }, [session?.user?.name])

  // Redirigir si ya tiene perfil completo
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (session.user.role === "ADMIN") {
        router.push("/admin")
      } else if (session.user.role === "CLUB") {
        router.push("/club")
      } else if (session.user.role === "PLAYER") {
        router.push("/jugador")
      }
    }
  }, [status, session, router])

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  async function handlePlayerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "player",
          firstName,
          lastName,
          sex,
          city,
          country,
          age: age ? parseInt(age) : undefined,
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
      router.push("/jugador")
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleClubSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "club",
          clubName,
          city: clubCity,
          address: clubAddress,
          latitude: clubLatitude,
          longitude: clubLongitude,
          rfc: clubRfc || undefined,
          indoorCourts: indoorCourts ? parseInt(indoorCourts) : undefined,
          outdoorCourts: outdoorCourts ? parseInt(outdoorCourts) : undefined,
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

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      <Card className="relative z-10 w-full max-w-lg border-border/50 bg-card">
        <CardHeader className="items-center pb-2 pt-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold uppercase text-card-foreground">WhinPadel</span>
          </div>
          <h1 className="font-display text-xl font-bold text-card-foreground">Completa tu Perfil</h1>
          <p className="text-sm text-muted-foreground">Para comenzar, dinos que tipo de cuenta necesitas</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Tabs defaultValue="jugador" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jugador" className="gap-2">
                <User className="h-4 w-4" />
                Jugador
              </TabsTrigger>
              <TabsTrigger value="club" className="gap-2">
                <Building2 className="h-4 w-4" />
                Club
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jugador" className="mt-6">
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input id="nombre" placeholder="Carlos" className="bg-background" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input id="apellido" placeholder="Mendoza" className="bg-background" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <Button onClick={() => setStep(2)} className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Continuar
                  </Button>
                </div>
              )}
              {step === 2 && (
                <form className="flex flex-col gap-4" onSubmit={handlePlayerSubmit}>
                  <div className="flex flex-col gap-2">
                    <Label>Sexo</Label>
                    <Select value={sex} onValueChange={setSex} required>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>Ciudad</Label>
                      <Select value={city} onValueChange={setCity} required>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="San Luis Potosi">San Luis Potosi</SelectItem>
                          <SelectItem value="Ciudad de Mexico">Ciudad de Mexico</SelectItem>
                          <SelectItem value="Guadalajara">Guadalajara</SelectItem>
                          <SelectItem value="Monterrey">Monterrey</SelectItem>
                          <SelectItem value="Madrid">Madrid</SelectItem>
                          <SelectItem value="Barcelona">Barcelona</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Pais</Label>
                      <Select value={country} onValueChange={setCountry} required>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Pais" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="ES">Espana</SelectItem>
                          <SelectItem value="AR">Argentina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="edad">Edad</Label>
                    <Input id="edad" type="number" placeholder="28" className="bg-background" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      Atras
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Completar Perfil
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="club" className="mt-6">
              <form className="flex flex-col gap-4" onSubmit={handleClubSubmit}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-name">Nombre del Club</Label>
                  <Input id="club-name" placeholder="Padel Center CDMX" className="bg-background" value={clubName} onChange={(e) => setClubName(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Ciudad</Label>
                  <Select value={clubCity} onValueChange={setClubCity} required>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="San Luis Potosi">San Luis Potosi</SelectItem>
                      <SelectItem value="Ciudad de Mexico">Ciudad de Mexico</SelectItem>
                      <SelectItem value="Guadalajara">Guadalajara</SelectItem>
                      <SelectItem value="Monterrey">Monterrey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <AddressAutocomplete
                  label="Direccion o Negocio"
                  placeholder="Busca tu club o escribe la dirección..."
                  value={clubAddress}
                  onChange={setClubAddress}
                  onCoordinatesChange={(lat, lng) => {
                    setClubLatitude(lat)
                    setClubLongitude(lng)
                  }}
                  onPlaceSelected={(place) => {
                    // Si el usuario selecciona un negocio, auto-completar el nombre
                    if (place.name && !clubName) {
                      setClubName(place.name)
                    }
                  }}
                  required
                  helperText="Busca tu negocio en Google Maps por nombre o dirección"
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-rfc">RFC (opcional)</Label>
                  <Input 
                    id="club-rfc" 
                    placeholder="ABC123456XYZ" 
                    className="bg-background" 
                    value={clubRfc} 
                    onChange={(e) => setClubRfc(e.target.value.toUpperCase())} 
                    maxLength={13}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="indoor">Canchas Interiores</Label>
                    <Input id="indoor" type="number" placeholder="4" className="bg-background" value={indoorCourts} onChange={(e) => setIndoorCourts(e.target.value)} min="0" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outdoor">Canchas Exteriores</Label>
                    <Input id="outdoor" type="number" placeholder="4" className="bg-background" value={outdoorCourts} onChange={(e) => setOutdoorCourts(e.target.value)} min="0" />
                  </div>
                </div>
                <Button type="submit" className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Completar Perfil
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
