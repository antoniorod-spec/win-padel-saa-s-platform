"use client"

import { useMemo, useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  COMPETITION_CATEGORIES,
  MODALITY_OPTIONS,
  TOURNAMENT_CLASS_OPTIONS,
  TOURNAMENT_CLASS_LABELS,
  TOURNAMENT_CLASS_POINTS,
  TOURNAMENT_CLASS_BADGE_CLASS,
  TOURNAMENT_CLASS_ICON,
} from "@/lib/tournament/categories"
import { defaultWeeklySchedule, WeeklyScheduleEditor, DaySchedule } from "@/components/club/weekly-schedule-editor"
import { ImageUploadField } from "@/components/club/image-upload-field"
import {
  useCreateTournamentCourt,
  useDeleteTournamentCourt,
  useSetTournamentCourtAvailability,
  useTournament,
  useTournamentCourts,
} from "@/hooks/use-tournaments"
import { createTournament, transitionTournamentStatus, updateTournament } from "@/lib/api/tournaments"
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, Send, Bot, Megaphone, MapPin, MessageCircle, Link2, Clock, Trophy, Medal, Target, Zap } from "lucide-react"
import { TournamentRegistrationStep } from "@/components/club/tournament-registration-step"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Progress } from "@/components/ui/progress"

type WizardStepId = "general" | "categorias" | "canchas" | "registro" | "revision"

const steps: Array<{ id: WizardStepId; label: string }> = [
  { id: "general", label: "General" },
  { id: "categorias", label: "Categorias" },
  { id: "canchas", label: "Canchas y Horarios" },
  { id: "registro", label: "Registro de Parejas" },
  { id: "revision", label: "Revision" },
]

type DraftModality = {
  modality: (typeof MODALITY_OPTIONS)[number]
  category: string
  prizeType?: "CASH" | "GIFT" | null
  prizeAmount?: number | null
  prizeDescription?: string | null
  minPairs?: number | null
  maxPairs?: number | null
}

const TOURNAMENT_CLASS_ICONS = { Trophy, Medal, Target, Zap } as const

function dayKeyToDayOfWeek(key: DaySchedule["day"]): number {
  switch (key) {
    case "SUNDAY":
      return 0
    case "MONDAY":
      return 1
    case "TUESDAY":
      return 2
    case "WEDNESDAY":
      return 3
    case "THURSDAY":
      return 4
    case "FRIDAY":
      return 5
    case "SATURDAY":
      return 6
  }
}

export function NewTournamentWizard() {
  const router = useRouter()
  const { toast } = useToast()

  const [stepIdx, setStepIdx] = useState(0)
  const step = steps[stepIdx]

  const [tournamentId, setTournamentId] = useState<string>("")

  // Step 1: General
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [venue, setVenue] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [registrationDeadline, setRegistrationDeadline] = useState("")
  const [tournamentClass, setTournamentClass] = useState<(typeof TOURNAMENT_CLASS_OPTIONS)[number]>("REGULAR")
  const [format, setFormat] = useState<"ELIMINATION" | "ROUND_ROBIN" | "LEAGUE" | "EXPRESS">("ROUND_ROBIN")
  const [type, setType] = useState<"FULL" | "BASIC">("FULL")
  const [inscriptionPrice, setInscriptionPrice] = useState("0")
  const [maxTeams, setMaxTeams] = useState("64")
  const [matchDurationMinutes, setMatchDurationMinutes] = useState("70")
  const [prize, setPrize] = useState("")
  const [posterUrl, setPosterUrl] = useState("")
  const [officialBall, setOfficialBall] = useState("")
  const [supportWhatsApp, setSupportWhatsApp] = useState("")
  const [registrationOpensAt, setRegistrationOpensAt] = useState("")
  const [externalRegistrationLink, setExternalRegistrationLink] = useState("")
  const [goldenPoint, setGoldenPoint] = useState(true)
  const [thirdSetTiebreakTo10, setThirdSetTiebreakTo10] = useState(true)
  const [setTo4Games, setSetTo4Games] = useState(false)
  const [rulesPdfUrl, setRulesPdfUrl] = useState("")
  const [rulesPdfUploading, setRulesPdfUploading] = useState(false)

  // Step 2: Categorias (TournamentModality[])
  const [modalities, setModalities] = useState<DraftModality[]>([])

  // Step 3: Canchas y horarios
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(defaultWeeklySchedule())
  const [newCourtName, setNewCourtName] = useState("")
  const [newCourtVenue, setNewCourtVenue] = useState("")
  const [newCourtIndoor, setNewCourtIndoor] = useState(false)

  const tournamentQuery = useTournament(tournamentId || undefined)
  const courtsQuery = useTournamentCourts(tournamentId || undefined)
  const createCourt = useCreateTournamentCourt()
  const deleteCourt = useDeleteTournamentCourt()
  const setAvailability = useSetTournamentCourtAvailability()

  const requiredHoursHint = useMemo(() => {
    return null as null | { required: number; available: number }
  }, [])

  const currentStatus = tournamentQuery.data?.data?.status ?? (tournamentId ? "DRAFT" : "")

  function buildAvailabilitiesFromWeeklySchedule(schedule: DaySchedule[]) {
    const items: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = []
    for (const day of schedule) {
      if (day.closed) continue
      const dayOfWeek = dayKeyToDayOfWeek(day.day)
      for (const slot of day.slots) {
        const startTime = slot.start
        const endTime = slot.end
        if (!startTime || !endTime) continue
        items.push({ dayOfWeek, startTime, endTime })
      }
    }
    return items
  }

  async function ensureDraftSynced() {
    const payload: Record<string, unknown> = {
      name,
      description,
      venue,
      startDate,
      endDate,
      registrationDeadline: registrationDeadline
        ? (() => {
            let d = registrationDeadline
            if (!d.includes("T")) d = `${d}T23:59`
            if (!d.endsWith(":00") && !d.endsWith("Z")) d = `${d}:00`
            return d
          })()
        : undefined,
      registrationOpensAt: registrationOpensAt
        ? (() => {
            let d = registrationOpensAt
            if (!d.includes("T")) d = `${d}T00:00`
            if (!d.endsWith(":00") && !d.endsWith("Z")) d = `${d}:00`
            return d
          })()
        : undefined,
      officialBall: officialBall || undefined,
      supportWhatsApp: supportWhatsApp || undefined,
      externalRegistrationLink: type === "BASIC" ? (externalRegistrationLink || undefined) : undefined,
      category: tournamentClass,
      format,
      type,
      inscriptionPrice: Number(inscriptionPrice || 0),
      maxTeams: Number(maxTeams || 64),
      matchDurationMinutes: Number(matchDurationMinutes || 70),
      prize: prize || undefined,
      posterUrl: posterUrl || undefined,
      rulesPdfUrl: rulesPdfUrl || undefined,
      rules: {
        goldenPoint,
        thirdSetTiebreakTo10,
        gamesPerSet: setTo4Games ? 4 : 6,
      },
      modalities: modalities.map((m) => ({
        modality: m.modality,
        category: m.category,
        prizeType: m.prizeType ?? undefined,
        prizeAmount: m.prizeAmount ?? undefined,
        prizeDescription: m.prizeDescription ?? undefined,
        minPairs: type === "FULL" ? (m.minPairs ?? undefined) : undefined,
        maxPairs: type === "FULL" ? (m.maxPairs ?? undefined) : undefined,
      })),
    }

    if (!tournamentId) {
      const res = await createTournament(payload)
      if (!res?.success || !res?.data?.id) {
        throw new Error(res?.error || "No se pudo crear el torneo")
      }
      setTournamentId(res.data.id)
      return res.data.id as string
    }

    const res = await updateTournament(tournamentId, payload)
    if (!res?.success) throw new Error(res?.error || "No se pudo guardar el borrador")
    return tournamentId
  }

  async function goNext() {
    try {
      if (step.id === "general") {
        if (!name.trim()) throw new Error("Nombre del torneo requerido")
        if (!startDate || !endDate) throw new Error("Fechas de inicio y fin requeridas")
      }

      if (step.id === "categorias") {
        const clean = modalities
          .map((m) => ({
            modality: m.modality,
            category: (m.category || "").trim(),
            prizeType: m.prizeType ?? undefined,
            prizeAmount: m.prizeAmount ?? undefined,
            prizeDescription: m.prizeDescription ?? undefined,
          }))
          .filter((m) => m.category.length > 0)
        if (clean.length === 0) throw new Error("Agrega al menos una categoria/modalidad (requerido para ranking, premios y filtros)")

        const seen = new Set<string>()
        for (const m of clean) {
          const key = `${m.modality}::${m.category}`
          if (seen.has(key)) throw new Error(`Categoria duplicada: ${m.modality} ${m.category}`)
          seen.add(key)
        }
        setModalities(clean)

        await ensureDraftSynced()
      }

      setStepIdx((i) => Math.min(steps.length - 1, i + 1))
    } catch (err) {
      toast({
        title: "No se pudo continuar",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      })
    }
  }

  function goBack() {
    setStepIdx((i) => Math.max(0, i - 1))
  }

  async function handleSaveDraft() {
    try {
      await ensureDraftSynced()
      toast({ title: "Borrador guardado" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      })
    }
  }

  async function handleCreateCourt() {
    try {
      const id = await ensureDraftSynced()
      if (!newCourtName.trim() || !newCourtVenue.trim()) throw new Error("Nombre y sede son requeridos")
      await createCourt.mutateAsync({
        tournamentId: id,
        data: { name: newCourtName.trim(), venue: newCourtVenue.trim(), isIndoor: newCourtIndoor },
      })
      setNewCourtName("")
      setNewCourtVenue("")
      setNewCourtIndoor(false)
      toast({ title: "Cancha creada" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo crear la cancha",
        variant: "destructive",
      })
    }
  }

  async function handleApplyScheduleToAllCourts() {
    try {
      if (!tournamentId) throw new Error("Primero guarda el torneo (paso 2)")
      const courts = courtsQuery.data?.data ?? []
      if (courts.length === 0) throw new Error("Crea al menos 1 cancha")

      const availabilities = buildAvailabilitiesFromWeeklySchedule(weeklySchedule)
      if (availabilities.length === 0) throw new Error("Configura al menos un horario")

      await Promise.all(
        courts.map((c: any) =>
          setAvailability.mutateAsync({
            tournamentId,
            courtId: c.id,
            availabilities,
          })
        )
      )

      toast({ title: "Horarios aplicados a todas las canchas" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudieron aplicar los horarios",
        variant: "destructive",
      })
    }
  }

  async function handlePublish() {
    try {
      const id = await ensureDraftSynced()
      const res = await transitionTournamentStatus(id, "OPEN")
      if (!res?.success) {
        const details = Array.isArray((res as any)?.details) ? String((res as any).details.join(", ")) : ""
        throw new Error(res?.error || details || "No se pudo publicar")
      }
      toast({ title: "Torneo publicado", description: "Ya puedes empezar a recibir inscripciones." })
      router.push({ pathname: "/club", query: { section: "torneos" } } as any)
    } catch (err) {
      toast({
        title: "No se pudo publicar",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-4 md:py-6">
      {/* Cabecera compacta */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-xl font-black tracking-tight md:text-2xl">Crear Nuevo Torneo</h1>
          <p className="hidden text-sm text-muted-foreground md:block">
            Wizard estilo Stitch: configura categorias, canchas y horarios antes de publicar.
          </p>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push({ pathname: "/club", query: { section: "torneos" } } as any)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="hidden md:inline-flex" onClick={() => router.push({ pathname: "/club", query: { section: "torneos" } } as any)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={handleSaveDraft}>
            <Save className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="hidden md:inline-flex" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" />
            Guardar borrador
          </Button>
        </div>
      </div>

      {/* Stepper adaptativo: móvil = progress + texto, desktop = tarjetas */}
      <div className="md:hidden">
        <p className="text-sm font-medium text-foreground">
          Paso {stepIdx + 1} de {steps.length}: {step.label}
        </p>
        <Progress value={((stepIdx + 1) / steps.length) * 100} className="mt-2 h-1.5" />
      </div>
      <Card className="hidden border-border/50 md:block">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((s, idx) => {
              const active = idx === stepIdx
              const done = idx < stepIdx
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                  <div
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black " +
                      (done || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
                    }
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={"truncate text-sm font-bold " + (active ? "text-foreground" : "text-muted-foreground")}>
                      {s.label}
                    </p>
                    {active ? (
                      <p className="truncate text-xs text-muted-foreground">Paso {stepIdx + 1} de {steps.length}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 pb-24 md:pb-0 lg:col-span-2">
          {step.id === "general" ? (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg font-black uppercase tracking-wide">Configuración General</CardTitle>
                <p className="text-sm text-muted-foreground">Paso 1: Define la identidad y logística básica de tu evento.</p>
              </CardHeader>
              <CardContent className="space-y-12 p-4 md:p-8">
                {/* Tipo de Gestión */}
                <section>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Tipo de Gestión</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setType("FULL")}
                      className={`relative flex flex-row items-start gap-3 rounded-xl border-2 p-4 text-left transition-all md:flex-col md:gap-0 md:p-6 ${
                        type === "FULL" ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-muted-foreground/30"
                      }`}
                    >
                      {type === "FULL" && (
                        <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground uppercase md:right-4 md:top-4 md:text-[10px]">
                          Recomendado
                        </span>
                      )}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:mb-4 md:h-12 md:w-12 md:rounded-xl ${type === "FULL" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Bot className="h-4 w-4 md:h-6 md:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold mb-0.5 md:mb-1">Torneo Inteligente</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Gestión total: categorías, inscripciones, cuadros automáticos y rol de juegos en la plataforma.
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("BASIC")}
                      className={`relative flex flex-row items-start gap-3 rounded-xl border-2 p-4 text-left transition-all md:flex-col md:gap-0 md:p-6 ${
                        type === "BASIC" ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:mb-4 md:h-12 md:w-12 md:rounded-xl ${type === "BASIC" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Megaphone className="h-4 w-4 md:h-6 md:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold mb-0.5 md:mb-1">Sólo Difusión</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Aparece en el calendario nacional. La gestión de inscripciones y cuadros es externa (WhatsApp/Link).
                        </p>
                      </div>
                    </button>
                  </div>
                </section>

                {/* Información Básica */}
                <section>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Información Básica</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label>Nombre del Torneo</Label>
                      <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Open CDMX 2024" />
                    </div>
                    <div>
                      <Label>Nivel / Clase</Label>
                      <Select value={tournamentClass} onValueChange={(v: any) => setTournamentClass(v)}>
                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TOURNAMENT_CLASS_OPTIONS.map((opt) => {
                            const Icon = TOURNAMENT_CLASS_ICONS[TOURNAMENT_CLASS_ICON[opt]]
                            return (
                              <SelectItem key={opt} value={opt}>
                                <span className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {TOURNAMENT_CLASS_LABELS[opt]} ({TOURNAMENT_CLASS_POINTS[opt]} pts)
                                </span>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pelota Oficial</Label>
                      <Select value={officialBall || "none"} onValueChange={(v) => setOfficialBall(v === "none" ? "" : v)}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin especificar</SelectItem>
                          <SelectItem value="HEAD_PRO_S">Head Pro S</SelectItem>
                          <SelectItem value="BABOLAT_COURT">Babolat Court</SelectItem>
                          <SelectItem value="WILSON_X3">Wilson X3</SelectItem>
                          <SelectItem value="OTHER">Otra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Inscripción por Pareja (MXN)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                        <Input className="h-12 pl-8" type="number" min={0} value={inscriptionPrice} onChange={(e) => setInscriptionPrice(e.target.value)} placeholder="1200" />
                      </div>
                    </div>
                    <div>
                      <Label>Bolsa de Premios Total (MXN)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                        <Input className="h-12 pl-8" type="number" min={0} value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="50000" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descripción del Evento</Label>
                      <Textarea className="min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalla las reglas, formato de juego y políticas..." rows={3} />
                    </div>
                  </div>
                </section>

                {/* Bloque 1: Reglamento y Reglas */}
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-slate-50 p-6">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Reglamento y Reglas</h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="mb-1.5 block">Reglamento del torneo</Label>
                        <div className="border-2 border-dashed border-border rounded-xl p-6 bg-white">
                          {rulesPdfUrl ? (
                            <div className="flex items-center justify-between gap-4">
                              <a href={rulesPdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate">
                                Ver reglamento (PDF)
                              </a>
                              <Button type="button" variant="outline" size="sm" onClick={() => setRulesPdfUrl("")}>
                                Quitar
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept="application/pdf"
                                disabled={rulesPdfUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  setRulesPdfUploading(true)
                                  try {
                                    const fd = new FormData()
                                    fd.append("file", file)
                                    const res = await fetch("/api/uploads/club/tournament-rules", { method: "POST", body: fd })
                                    const data = await res.json()
                                    if (data?.data?.publicUrl) setRulesPdfUrl(data.data.publicUrl)
                                    else toast({ title: "Error", description: data?.error || "No se pudo subir", variant: "destructive" })
                                  } catch {
                                    toast({ title: "Error", description: "No se pudo subir el PDF", variant: "destructive" })
                                  } finally {
                                    setRulesPdfUploading(false)
                                    e.target.value = ""
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                Sube un PDF con el reglamento. Si no subes ninguno, se aplicará el reglamento base de todos los torneos.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="mb-1.5 block">Formato de Partido</Label>
                          <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ROUND_ROBIN">Round Robin + Playoff</SelectItem>
                              <SelectItem value="ELIMINATION">Eliminación Directa</SelectItem>
                              <SelectItem value="LEAGUE">Liga / Todos contra Todos</SelectItem>
                              <SelectItem value="EXPRESS">Cuadro con Consolación</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="mb-1.5 block">Duración Estimada (Minutos)</Label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input className="h-12 pl-12" type="number" min={15} max={180} value={matchDurationMinutes} onChange={(e) => setMatchDurationMinutes(e.target.value)} placeholder="90" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-4">
                          <Switch id="golden_point" checked={goldenPoint} onCheckedChange={setGoldenPoint} />
                          <Label htmlFor="golden_point" className="mb-0 font-medium cursor-pointer">Punto de Oro</Label>
                        </div>
                        <div className="flex items-center gap-4">
                          <Switch id="third_set_tiebreak" checked={thirdSetTiebreakTo10} onCheckedChange={setThirdSetTiebreakTo10} />
                          <Label htmlFor="third_set_tiebreak" className="mb-0 font-medium cursor-pointer">Super Tie-Break</Label>
                        </div>
                        <div className="flex items-center gap-4">
                          <Switch id="set_to_4_games" checked={setTo4Games} onCheckedChange={setSetTo4Games} />
                          <Label htmlFor="set_to_4_games" className="mb-0 font-medium cursor-pointer">Sets a 4 juegos</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Configuración */}
                  <div className="rounded-xl border border-border bg-slate-50 p-6">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Configuración</h2>
                    <div className="space-y-2">
                      <Label className="mb-1.5 block">Máx. parejas (global)</Label>
                      <Input className="h-12 max-w-xs" type="number" min={2} value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-1">El mínimo y máximo por categoría se configuran al agregar cada categoría.</p>
                    </div>
                  </div>

                  {/* Bloque 3: Fechas y Logística */}
                  <div className="rounded-xl border border-border bg-slate-50 p-6">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Fechas y Logística</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                      <div className="space-y-2">
                        <Label className="mb-1.5 block">Duración del Torneo</Label>
                        <DateRangePicker
                          value={{ from: startDate, to: endDate }}
                          onChange={({ from, to }) => {
                            setStartDate(from)
                            setEndDate(to)
                          }}
                          placeholder="Seleccionar periodo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="mb-1.5 block">Periodo de Inscripciones</Label>
                        <DateRangePicker
                          value={{
                            from: registrationOpensAt ? registrationOpensAt.slice(0, 10) : "",
                            to: registrationDeadline ? registrationDeadline.slice(0, 10) : "",
                          }}
                          onChange={({ from, to }) => {
                            const openTime = registrationOpensAt?.includes("T")
                              ? registrationOpensAt.slice(11, 16)
                              : "09:00"
                            const closeTime = registrationDeadline?.includes("T")
                              ? registrationDeadline.slice(11, 16)
                              : "23:59"
                            setRegistrationOpensAt(from ? `${from}T${openTime}` : "")
                            setRegistrationDeadline(to ? `${to}T${closeTime}` : "")
                          }}
                          placeholder="Seleccionar periodo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="mb-1.5 block">Sede (Club)</Label>
                        <div className="relative">
                          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input className="h-12 pl-4 pr-12" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Club / Dirección" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="mb-1.5 block">WhatsApp de Soporte</Label>
                        <div className="relative">
                          <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input className="h-12 pl-12" type="tel" value={supportWhatsApp} onChange={(e) => setSupportWhatsApp(e.target.value)} placeholder="+52 (55) 0000 0000" />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className={`mb-1.5 block ${type === "BASIC" ? "" : "text-muted-foreground/60"}`}>Link de Inscripción Externo</Label>
                        <div className="relative">
                          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            className={`h-12 pl-12 ${type === "BASIC" ? "" : "bg-muted cursor-not-allowed"}`}
                            placeholder="https://..."
                            value={externalRegistrationLink}
                            onChange={(e) => type === "BASIC" && setExternalRegistrationLink(e.target.value)}
                            disabled={type !== "BASIC"}
                          />
                        </div>
                        {type === "BASIC" && <p className="text-[10px] text-muted-foreground mt-1 italic">* Disponible solo en Sólo Difusión</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cartel del Torneo */}
                <section>
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Cartel del Torneo</h2>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 bg-muted/20">
                    <ImageUploadField
                      label="Haz clic o arrastra el cartel aquí"
                      endpoint="/api/uploads/club/tournament-poster"
                      value={posterUrl ? [posterUrl] : []}
                      onChange={(urls) => setPosterUrl(urls[0] || "")}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Formatos aceptados: JPG, PNG (Max. 5MB). Relación sugerida: 4:5</p>
                  </div>
                </section>
              </CardContent>
            </Card>
          ) : null}

          {step.id === "categorias" ? (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-lg font-black uppercase tracking-wide">Categorias y modalidades</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Agrega varias categorias por torneo (Varonil, Femenil y Mixto).
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-primary text-primary-foreground"
                    onClick={() =>
                      setModalities((prev) => [...prev, { modality: "VARONIL", category: "4ta" }])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Anadir categoria
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {type === "BASIC" ? (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Las categorías son necesarias para asignar puntos al ranking, publicar premios y poder filtrar torneos. No se generan grupos, calendarios ni resultados desde la plataforma.
                  </div>
                ) : null}
                {(type === "FULL" || type === "BASIC") && (
                  <>
                    {modalities.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                        No hay categorías. Haz clic en &quot;Añadir categoría&quot; para agregar al menos una (requerido para ranking, premios y filtros).
                      </div>
                    ) : null}
                    {modalities.map((m, idx) => (
                      <div key={`${m.modality}-${idx}`} className="rounded-lg border border-border/50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                          <div className="grid flex-1 gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Modalidad</Label>
                              <Select
                                value={m.modality}
                                onValueChange={(v: any) =>
                                  setModalities((prev) => prev.map((it, i) => (i === idx ? { ...it, modality: v } : it)))
                                }
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {MODALITY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Categoria</Label>
                              <Select
                                value={m.category}
                                onValueChange={(v) =>
                                  setModalities((prev) => prev.map((it, i) => (i === idx ? { ...it, category: v } : it)))
                                }
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {COMPETITION_CATEGORIES.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="md:mb-1"
                            onClick={() => setModalities((prev) => prev.filter((_, i) => i !== idx))}
                            disabled={modalities.length <= 1}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Quitar
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 border-t border-border/50 pt-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Premio (tipo)</Label>
                            <Select
                              value={m.prizeType ?? "none"}
                              onValueChange={(v) =>
                                setModalities((prev) =>
                                  prev.map((it, i) =>
                                    i === idx
                                      ? {
                                          ...it,
                                          prizeType: v === "none" ? undefined : (v as "CASH" | "GIFT"),
                                          prizeAmount: v === "CASH" ? it.prizeAmount : undefined,
                                          prizeDescription: v === "GIFT" ? it.prizeDescription : undefined,
                                        }
                                      : it
                                  )
                                )
                              }
                            >
                              <SelectTrigger><SelectValue placeholder="Sin premio" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin premio</SelectItem>
                                <SelectItem value="CASH">Efectivo</SelectItem>
                                <SelectItem value="GIFT">Regalo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {m.prizeType === "CASH" ? (
                            <div className="space-y-2">
                              <Label className="text-xs">Monto (MXN)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={m.prizeAmount ?? ""}
                                onChange={(e) =>
                                  setModalities((prev) =>
                                    prev.map((it, i) =>
                                      i === idx ? { ...it, prizeAmount: e.target.value ? Number(e.target.value) : undefined } : it
                                    )
                                  )
                                }
                                placeholder="5000"
                              />
                            </div>
                          ) : null}
                          {type === "FULL" ? (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs">Mín. parejas para abrir</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  placeholder="6"
                                  value={m.minPairs ?? ""}
                                  onChange={(e) =>
                                    setModalities((prev) =>
                                      prev.map((it, i) =>
                                        i === idx
                                          ? { ...it, minPairs: e.target.value ? Number(e.target.value) : undefined }
                                          : it
                                      )
                                    )
                                  }
                                />
                                <p className="text-xs text-muted-foreground">Vacío = usar 6</p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Máx. parejas</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  placeholder={maxTeams}
                                  value={m.maxPairs ?? ""}
                                  onChange={(e) =>
                                    setModalities((prev) =>
                                      prev.map((it, i) =>
                                        i === idx
                                          ? { ...it, maxPairs: e.target.value ? Number(e.target.value) : undefined }
                                          : it
                                      )
                                    )
                                  }
                                />
                                <p className="text-xs text-muted-foreground">Vacío = usar {maxTeams}</p>
                              </div>
                            </>
                          ) : null}
                          {m.prizeType === "GIFT" ? (
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-xs">Descripcion (ej: 2 palas X, paleteros)</Label>
                              <Input
                                value={m.prizeDescription ?? ""}
                                onChange={(e) =>
                                  setModalities((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, prizeDescription: e.target.value || undefined } : it))
                                  )
                                }
                                placeholder="2 palas X, paleteros..."
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Infantil y Senior se manejan como categoria dentro de la modalidad (ej: Mixto Senior).
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          {step.id === "canchas" ? (
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-lg font-black uppercase tracking-wide">Canchas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!tournamentId ? (
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
                      Primero define las categorias (paso 2) para crear el borrador del torneo.
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input value={newCourtName} onChange={(e) => setNewCourtName(e.target.value)} placeholder="Cancha 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Sede</Label>
                      <Input value={newCourtVenue} onChange={(e) => setNewCourtVenue(e.target.value)} placeholder="Panoramica / Central" />
                    </div>
                    <div className="space-y-2">
                      <Label>Indoor</Label>
                      <div className="flex h-10 items-center gap-3 rounded-md border border-input px-3">
                        <Switch checked={newCourtIndoor} onCheckedChange={setNewCourtIndoor} />
                        <span className="text-sm text-muted-foreground">{newCourtIndoor ? "Si" : "No"}</span>
                      </div>
                    </div>
                  </div>
                  <Button type="button" className="bg-primary text-primary-foreground" onClick={handleCreateCourt} disabled={createCourt.isPending}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear cancha
                  </Button>

                  <div className="space-y-2">
                    <Label>Canchas creadas</Label>
                    <div className="grid gap-2">
                      {(courtsQuery.data?.data ?? []).map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.venue}{c.isIndoor ? " • Indoor" : ""}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => deleteCourt.mutateAsync({ tournamentId, courtId: c.id })}
                            disabled={deleteCourt.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      ))}
                      {(courtsQuery.data?.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aun no hay canchas.</p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="font-display text-lg font-black uppercase tracking-wide">Horarios</CardTitle>
                    <Button type="button" variant="outline" onClick={handleApplyScheduleToAllCourts} disabled={setAvailability.isPending}>
                      Aplicar a todas las canchas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <WeeklyScheduleEditor value={weeklySchedule} onChange={setWeeklySchedule} />
                  <p className="text-xs text-muted-foreground">
                    Esto reemplaza la disponibilidad semanal de cada cancha (puedes volver y ajustarla cuando quieras).
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {step.id === "registro" ? (
            tournamentId && type === "FULL" ? (
              <TournamentRegistrationStep
                tournamentId={tournamentId}
                modalities={
                  (tournamentQuery.data?.data?.modalities ?? []).map((m: { id: string; modality: string; category: string }) => ({
                    id: m.id,
                    modality: m.modality,
                    category: m.category,
                  }))
                }
                clubId={tournamentQuery.data?.data?.clubId}
                maxTeams={Number(maxTeams || 64)}
                showImportExcel
              />
            ) : (
              <Card className="border-border/50">
                <CardContent className="py-8">
                  {!tournamentId ? (
                    <p className="text-center text-muted-foreground">
                      Primero completa los pasos anteriores para crear el borrador del torneo.
                    </p>
                  ) : type === "BASIC" ? (
                    <p className="text-center text-muted-foreground">
                      En Sólo Difusión las inscripciones se gestionan externamente. Las categorías configuradas permiten asignar puntos al ranking, publicar premios y filtrar torneos.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )
          ) : null}

          {step.id === "revision" ? (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg font-black uppercase tracking-wide">Revision y publicacion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm">
                  <p className="font-semibold">Checklist minimo para publicar</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                    <li>Al menos 1 categoría/modalidad (ranking, premios y filtros)</li>
                    <li>Al menos 1 cancha creada</li>
                    <li>Horarios configurados (recomendado)</li>
                  </ul>
                </div>

                {currentStatus === "OPEN" ? (
                  <div className="rounded-lg border border-border/50 p-4 text-sm">
                    <p className="font-semibold">Este torneo ya esta publicado.</p>
                    <p className="mt-1 text-muted-foreground">
                      Puedes volver al listado o ir a la automatizacion para generar slots/grupos/rol.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => router.push({ pathname: "/club", query: { section: "torneos" } } as any)}>
                        Volver a torneos
                      </Button>
                      {tournamentId ? (
                        <Button
                          type="button"
                          className="bg-primary text-primary-foreground"
                          onClick={() => router.push({ pathname: "/club/torneos/[id]/automatizacion", params: { id: String(tournamentId) } } as any)}
                        >
                          Ir a automatizacion
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handlePublish}
                    disabled={!tournamentId}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Publicar torneo
                  </Button>
                )}

                {!tournamentId ? (
                  <p className="text-sm text-muted-foreground">
                    Para publicar primero guarda el borrador completando el paso de categorias.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Nav actions: sticky en móvil, estático en desktop */}
          <div className="sticky bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:static md:border-0 md:bg-transparent md:p-0">
            <Button type="button" variant="outline" onClick={goBack} disabled={stepIdx === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atras
            </Button>
            <Button type="button" className="bg-primary text-primary-foreground" onClick={goNext} disabled={stepIdx === steps.length - 1}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right column: Summary */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge className={TOURNAMENT_CLASS_BADGE_CLASS[tournamentClass]}>
                  {(() => {
                    const Icon = TOURNAMENT_CLASS_ICONS[TOURNAMENT_CLASS_ICON[tournamentClass]]
                    return (
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {TOURNAMENT_CLASS_LABELS[tournamentClass]} ({TOURNAMENT_CLASS_POINTS[tournamentClass]} pts)
                      </span>
                    )
                  })()}
                </Badge>
                <Badge variant="outline">{format}</Badge>
                <Badge variant="outline">{type === "FULL" ? "Torneo Inteligente" : "Sólo Difusión"}</Badge>
                {currentStatus ? <Badge className="bg-primary/10 text-primary">{String(currentStatus)}</Badge> : null}
              </div>

              <div>
                <p className="font-semibold text-foreground">{name || "Sin nombre"}</p>
                <p className="text-xs text-muted-foreground">{venue || "Sede por definir"}</p>
              </div>

              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Categorias</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {modalities.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Sin categorias</span>
                  ) : (
                    modalities.map((m, i) => (
                      <Badge key={`${m.modality}-${m.category}-${i}`} variant="outline">
                        {m.modality} {m.category}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Canchas</p>
                <p className="mt-1 font-semibold">{(courtsQuery.data?.data ?? []).length}</p>
              </div>

              {requiredHoursHint ? (
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Capacidad</p>
                  <p className="mt-1 text-sm">
                    {requiredHoursHint.required}h requeridas / {requiredHoursHint.available}h disponibles
                  </p>
                </div>
              ) : null}

              {posterUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Cartel</p>
                  <img src={posterUrl} alt="Cartel" className="h-28 w-full rounded-lg border border-border object-cover" />
                </div>
              ) : null}

              {tournamentId ? (
                <div className="pt-2 text-xs text-muted-foreground">
                  ID: <span className="font-mono">{tournamentId}</span>
                </div>
              ) : null}

              {tournamentQuery.data?.data?.status && tournamentQuery.data?.data?.status !== "DRAFT" ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                  Este torneo ya no esta en borrador: {String(tournamentQuery.data.data.status)}.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
