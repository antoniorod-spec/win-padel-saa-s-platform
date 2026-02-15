"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, User, Building2, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Player fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sex, setSex] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [age, setAge] = useState("")

  // Club fields
  const [clubName, setClubName] = useState("")
  const [clubEmail, setClubEmail] = useState("")
  const [clubPassword, setClubPassword] = useState("")
  const [clubCity, setClubCity] = useState("")
  const [courts, setCourts] = useState("")

  async function handlePlayerRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "player",
          email,
          password,
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
        setError(data.error ?? "Error al registrarse")
        return
      }

      router.push("/login?registered=true")
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleClubRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "club",
          email: clubEmail,
          password: clubPassword,
          clubName,
          city: clubCity,
          courts: courts ? parseInt(courts) : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al registrarse")
        return
      }

      router.push("/login?registered=true&type=club")
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      <Card className="relative z-10 w-full max-w-lg border-border/50 bg-card">
        <CardHeader className="items-center pb-2 pt-8">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold uppercase text-card-foreground">WinPadel</span>
          </Link>
          <h1 className="font-display text-xl font-bold text-card-foreground">Crear Cuenta</h1>
          <p className="text-sm text-muted-foreground">Selecciona tu tipo de cuenta y completa tu perfil</p>
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
                <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setStep(2) }}>
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
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reg-email">Correo electronico</Label>
                    <Input id="reg-email" type="email" placeholder="carlos@email.com" className="bg-background" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reg-pass">Contrasena</Label>
                    <Input id="reg-pass" type="password" placeholder="Min. 8 caracteres" className="bg-background" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                  </div>
                  <Button type="submit" className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Continuar
                  </Button>
                </form>
              )}
              {step === 2 && (
                <form className="flex flex-col gap-4" onSubmit={handlePlayerRegister}>
                  <div className="flex flex-col gap-2">
                    <Label>Sexo</Label>
                    <Select value={sex} onValueChange={setSex}>
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
                      <Select value={city} onValueChange={setCity}>
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
                      <Select value={country} onValueChange={setCountry}>
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
                      Crear Cuenta
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="club" className="mt-6">
              <form className="flex flex-col gap-4" onSubmit={handleClubRegister}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-name">Nombre del Club</Label>
                  <Input id="club-name" placeholder="Padel Center CDMX" className="bg-background" value={clubName} onChange={(e) => setClubName(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-email">Correo del Club</Label>
                  <Input id="club-email" type="email" placeholder="info@padelcenter.mx" className="bg-background" value={clubEmail} onChange={(e) => setClubEmail(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-pass">Contrasena</Label>
                  <Input id="club-pass" type="password" placeholder="Min. 8 caracteres" className="bg-background" value={clubPassword} onChange={(e) => setClubPassword(e.target.value)} required minLength={8} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Ciudad</Label>
                    <Select value={clubCity} onValueChange={setClubCity}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="San Luis Potosi">San Luis Potosi</SelectItem>
                        <SelectItem value="Ciudad de Mexico">Ciudad de Mexico</SelectItem>
                        <SelectItem value="Guadalajara">Guadalajara</SelectItem>
                        <SelectItem value="Monterrey">Monterrey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="canchas">Numero de Canchas</Label>
                    <Input id="canchas" type="number" placeholder="8" className="bg-background" value={courts} onChange={(e) => setCourts(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Club
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia sesion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
