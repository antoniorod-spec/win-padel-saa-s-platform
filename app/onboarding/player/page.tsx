"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Loader2, User, BadgeCheck, SlidersHorizontal, ArrowLeft, ArrowRight, Check } from "lucide-react"

export default function PlayerOnboardingPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [city, setCity] = useState("San Luis Potosi")
  const [state, setState] = useState("San Luis Potosi")
  const [country, setCountry] = useState("MX")
  const [phone, setPhone] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [sex, setSex] = useState("M")
  const [documentType, setDocumentType] = useState("CURP")
  const [documentNumber, setDocumentNumber] = useState("")

  const [courtPosition, setCourtPosition] = useState("")
  const [dominantHand, setDominantHand] = useState("")
  const [starShot, setStarShot] = useState("")
  const [playStyle, setPlayStyle] = useState("")
  const [preferredMatchType, setPreferredMatchType] = useState("")
  const [playsMixed, setPlaysMixed] = useState("")
  const [preferredSchedule, setPreferredSchedule] = useState("")
  const [preferredAgeRange, setPreferredAgeRange] = useState("")

  useEffect(() => {
    if (session?.user?.name) {
      const parts = session.user.name.split(" ")
      setFirstName(parts[0] ?? "")
      setLastName(parts.slice(1).join(" ") || "Jugador")
    }
  }, [session?.user?.name])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated" && session?.user?.role === "CLUB") router.push("/club")
    if (status === "authenticated" && session?.user?.role === "ADMIN") router.push("/admin")
  }, [status, session?.user?.role, router])

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

  async function submit() {
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
          city,
          state,
          country,
          phone,
          birthDate,
          sex,
          age: getAge(),
          documentType,
          documentNumber,
          courtPosition,
          dominantHand,
          starShot,
          playStyle,
          preferredMatchType,
          playsMixed: playsMixed === "si",
          preferredSchedule,
          preferredAgeRange,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar tu perfil")
        return
      }
      await update()
      router.push("/jugador")
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  function next() {
    if (step < totalSteps) setStep(step + 1)
    else submit()
  }

  function back() {
    if (step > 1) setStep(step - 1)
  }

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Completa tu perfil de jugador</CardTitle>
          <CardDescription>Paso {step} de {totalSteps}</CardDescription>
          <Progress value={progress} className="h-2" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span className={step === 1 ? "font-semibold text-foreground" : ""}><User className="mr-1 inline h-3 w-3" />Datos basicos</span>
            <span className={step === 2 ? "font-semibold text-foreground" : ""}><BadgeCheck className="mr-1 inline h-3 w-3" />Informacion personal</span>
            <span className={step === 3 ? "font-semibold text-foreground" : ""}><SlidersHorizontal className="mr-1 inline h-3 w-3" />Preferencias</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2"><Label>Nombre</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div className="flex flex-col gap-2"><Label>Apellido</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2"><Label>Ciudad</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div className="flex flex-col gap-2"><Label>Provincia</Label><Input value={state} onChange={(e) => setState(e.target.value)} /></div>
              <div className="flex flex-col gap-2"><Label>Pais</Label><Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MX">Mexico</SelectItem><SelectItem value="ES">Espana</SelectItem><SelectItem value="AR">Argentina</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Numero de telefono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 444..." /></div>
              <div className="flex flex-col gap-2"><Label>Fecha de nacimiento</Label><Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
              <div className="flex flex-col gap-2"><Label>Genero</Label><Select value={sex} onValueChange={setSex}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="M">Hombre</SelectItem><SelectItem value="F">Mujer</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2 md:col-span-1"><Label>Documento</Label><Select value={documentType} onValueChange={setDocumentType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CURP">CURP</SelectItem><SelectItem value="INE">INE</SelectItem><SelectItem value="PASAPORTE">Pasaporte</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2 md:col-span-2"><Label>Numero de documento</Label><Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2"><Label>Posicion en pista</Label><Select value={courtPosition} onValueChange={setCourtPosition}><SelectTrigger><SelectValue placeholder="Selecciona tu posicion" /></SelectTrigger><SelectContent><SelectItem value="DRIVE">Drive</SelectItem><SelectItem value="REVES">Reves</SelectItem><SelectItem value="AMBOS">Ambos</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Mano dominante</Label><Select value={dominantHand} onValueChange={setDominantHand}><SelectTrigger><SelectValue placeholder="Selecciona mano dominante" /></SelectTrigger><SelectContent><SelectItem value="DERECHA">Derecha</SelectItem><SelectItem value="IZQUIERDA">Izquierda</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Golpe estrella</Label><Select value={starShot} onValueChange={setStarShot}><SelectTrigger><SelectValue placeholder="Selecciona golpe estrella" /></SelectTrigger><SelectContent><SelectItem value="BANDEJA">Bandeja</SelectItem><SelectItem value="VIBORA">Vibora</SelectItem><SelectItem value="REMATE">Remate</SelectItem><SelectItem value="GLOBO">Globo</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Estilo de juego</Label><Select value={playStyle} onValueChange={setPlayStyle}><SelectTrigger><SelectValue placeholder="Selecciona estilo" /></SelectTrigger><SelectContent><SelectItem value="OFENSIVO">Ofensivo</SelectItem><SelectItem value="DEFENSIVO">Defensivo</SelectItem><SelectItem value="EQUILIBRADO">Equilibrado</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Tipo de partido</Label><Select value={preferredMatchType} onValueChange={setPreferredMatchType}><SelectTrigger><SelectValue placeholder="Selecciona tipo de partido" /></SelectTrigger><SelectContent><SelectItem value="COMPETITIVO">Competitivo</SelectItem><SelectItem value="AMISTOSO">Amistoso</SelectItem><SelectItem value="AMBOS">Ambos</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Partidos mixtos</Label><Select value={playsMixed} onValueChange={setPlaysMixed}><SelectTrigger><SelectValue placeholder="Quieres jugar mixtos?" /></SelectTrigger><SelectContent><SelectItem value="si">Si</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Horario preferido</Label><Select value={preferredSchedule} onValueChange={setPreferredSchedule}><SelectTrigger><SelectValue placeholder="Selecciona horario" /></SelectTrigger><SelectContent><SelectItem value="MANANA">Manana</SelectItem><SelectItem value="TARDE">Tarde</SelectItem><SelectItem value="NOCHE">Noche</SelectItem><SelectItem value="INDIFERENTE">Indiferente</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label>Rango de edad</Label><Select value={preferredAgeRange} onValueChange={setPreferredAgeRange}><SelectTrigger><SelectValue placeholder="Selecciona rango" /></SelectTrigger><SelectContent><SelectItem value="18-25">18-25</SelectItem><SelectItem value="26-35">26-35</SelectItem><SelectItem value="36-45">36-45</SelectItem><SelectItem value="46+">46+</SelectItem><SelectItem value="INDIFERENTE">Indiferente</SelectItem></SelectContent></Select></div>
            </div>
          )}

          {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={back} disabled={step === 1 || loading}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
            <Button type="button" onClick={next} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === totalSteps ? <>Terminar <Check className="ml-2 h-4 w-4" /></> : <>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>

          <Button type="button" variant="ghost" className="w-full" onClick={() => signOut({ callbackUrl: "/login" })}>Cancelar y salir</Button>
        </CardContent>
      </Card>
    </div>
  )
}
