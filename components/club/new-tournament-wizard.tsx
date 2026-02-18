"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  getCategoriesForModality,
  getCategoryLabel,
  MODALITY_OPTIONS,
  TOURNAMENT_CLASS_OPTIONS,
  TOURNAMENT_CLASS_LABELS,
  TOURNAMENT_CLASS_POINTS,
  TOURNAMENT_CLASS_BADGE_CLASS,
  TOURNAMENT_CLASS_ICON,
} from "@/lib/tournament/categories"
import { CourtsAndSchedulesStep, type CourtsAndSchedulesStepHandle } from "@/components/club/courts"
import { TournamentPosterUpload } from "@/components/club/tournament-poster-upload"
import { WizardSidebar } from "@/components/club/wizard-sidebar"
import { useTournament, useTournamentCourts, useTournamentTeams } from "@/hooks/use-tournaments"
import { createTournament, transitionTournamentStatus, updateTournament } from "@/lib/api/tournaments"
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, Send, Bot, Megaphone, MapPin, MessageCircle, Link2, Clock, Trophy, Medal, Target, Zap, Mars, Venus, Users, Lock } from "lucide-react"
import { TournamentRegistrationStep } from "@/components/club/tournament-registration-step"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

function mapCategoryToClass(c: string): (typeof TOURNAMENT_CLASS_OPTIONS)[number] {
  const mapped =
    c === "A"
      ? "ANUAL"
      : c === "B"
        ? "OPEN"
        : c === "C"
          ? "REGULAR"
          : c === "D"
            ? "EXPRESS"
            : c
  return (mapped as (typeof TOURNAMENT_CLASS_OPTIONS)[number]) ?? "REGULAR"
}

export interface NewTournamentWizardProps {
  /** Si se proporciona, el wizard carga el torneo existente para editar (solo DRAFT) */
  initialTournamentId?: string
}

export function NewTournamentWizard({ initialTournamentId }: NewTournamentWizardProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [stepIdx, setStepIdx] = useState(0)
  const step = steps[stepIdx]

  const [tournamentId, setTournamentId] = useState<string>(initialTournamentId ?? "")
  const [capacityTotal, setCapacityTotal] = useState(0)
  const [capacityRequired, setCapacityRequired] = useState(0)

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

  const tournamentQuery = useTournament(tournamentId || undefined)
  const courtsQuery = useTournamentCourts(tournamentId || undefined)
  const teamsQuery = useTournamentTeams(tournamentId || undefined)
  const hasLoadedInitialData = useRef(false)
  const courtsStepRef = useRef<CourtsAndSchedulesStepHandle>(null)
  const teams = (teamsQuery.data?.data ?? []) as Array<{ player1: string; player2: string }>
  const pairCount = teams.length
  const lastPairs = teams.slice(-3)

  // Cargar datos del torneo cuando editamos un draft existente (solo una vez)
  useEffect(() => {
    if (!initialTournamentId || !tournamentQuery.data?.data || hasLoadedInitialData.current) return
    hasLoadedInitialData.current = true
    const t = tournamentQuery.data.data as unknown as Record<string, unknown>
    setName(String(t.name ?? ""))
    setDescription(String(t.description ?? ""))
    setVenue(String(t.venue ?? ""))
    setStartDate(t.startDate ? new Date(t.startDate as string).toISOString().slice(0, 10) : "")
    setEndDate(t.endDate ? new Date(t.endDate as string).toISOString().slice(0, 10) : "")
    setRegistrationDeadline(
      t.registrationDeadline ? new Date(t.registrationDeadline as string).toISOString().slice(0, 16) : ""
    )
    setRegistrationOpensAt(
      t.registrationOpensAt ? new Date(t.registrationOpensAt as string).toISOString().slice(0, 16) : ""
    )
    setOfficialBall(String(t.officialBall ?? ""))
    setSupportWhatsApp(String(t.supportWhatsApp ?? ""))
    setExternalRegistrationLink(String(t.externalRegistrationLink ?? ""))
    const r = (t.rules ?? {}) as { goldenPoint?: boolean; thirdSetTiebreakTo10?: boolean; gamesPerSet?: number }
    setGoldenPoint(r?.goldenPoint ?? true)
    setThirdSetTiebreakTo10(r?.thirdSetTiebreakTo10 ?? true)
    setSetTo4Games(r?.gamesPerSet === 4)
    setRulesPdfUrl(String(t.rulesPdfUrl ?? ""))
    setTournamentClass(mapCategoryToClass(String(t.category ?? "REGULAR")))
    setFormat((t.format as "ELIMINATION" | "ROUND_ROBIN" | "LEAGUE" | "EXPRESS") ?? "ROUND_ROBIN")
    setType((t.type as "FULL" | "BASIC") ?? "FULL")
    setInscriptionPrice(String(t.inscriptionPrice ?? 0))
    setMaxTeams(String(t.maxTeams ?? 64))
    setMatchDurationMinutes(String(t.matchDurationMinutes ?? 70))
    setPrize(String(t.prize ?? ""))
    setPosterUrl(String(t.posterUrl ?? ""))
    const mods = (t.modalities ?? []) as Array<{
      modality: string
      category: string
      prizeType?: string | null
      prizeAmount?: number | null
      prizeDescription?: string | null
      minPairs?: number | null
      maxPairs?: number | null
    }>
    setModalities(
      mods.map((m) => ({
        modality: m.modality as (typeof MODALITY_OPTIONS)[number],
        category: m.category,
        prizeType: (m.prizeType as "CASH" | "GIFT") ?? undefined,
        prizeAmount: m.prizeAmount ?? undefined,
        prizeDescription: m.prizeDescription ?? undefined,
        minPairs: m.minPairs ?? undefined,
        maxPairs: m.maxPairs ?? undefined,
      }))
    )
  }, [initialTournamentId, tournamentQuery.data?.data])

  const requiredHoursHint = useMemo(() => {
    return null as null | { required: number; available: number }
  }, [])

  // Auto-corregir categorías duplicadas: si hay duplicados, cambiar las filas duplicadas a la primera opción disponible
  useEffect(() => {
    const seen = new Map<string, number[]>()
    modalities.forEach((m, i) => {
      const key = `${m.modality}::${m.category}`
      const list = seen.get(key) ?? []
      list.push(i)
      seen.set(key, list)
    })
    const toFix: number[] = []
    for (const [, indices] of seen) {
      if (indices.length > 1) toFix.push(...indices.slice(1))
    }
    if (toFix.length === 0) return
    setModalities((prev) => {
      let changed = false
      const next = prev.map((m, idx) => {
        if (!toFix.includes(idx)) return m
        const usedByOthers = new Set(
          prev.filter((_, j) => j !== idx).map((o) => `${o.modality}::${o.category}`)
        )
        const opts = MODALITY_OPTIONS.filter((opt) => !usedByOthers.has(`${opt}::${m.category}`))
        if (opts.length > 0 && opts[0] !== m.modality) {
          changed = true
          return { ...m, modality: opts[0] }
        }
        return m
      })
      return changed ? next : prev
    })
  }, [modalities])

  const currentStatus = tournamentQuery.data?.data?.status ?? (tournamentId ? "DRAFT" : "")

  async function ensureDraftSynced(modalitiesOverride?: DraftModality[]) {
    const mods = modalitiesOverride ?? modalities
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
    }

    // Only include modalities when there are no registrations to avoid API rejection
    const hasRegistrations = pairCount > 0
    if (!hasRegistrations) {
      payload.modalities = mods.map((m) => ({
        modality: m.modality,
        category: m.category,
        prizeType: m.prizeType ?? undefined,
        prizeAmount: m.prizeAmount ?? undefined,
        prizeDescription: m.prizeDescription ?? undefined,
        minPairs: type === "FULL" ? (m.minPairs ?? undefined) : undefined,
        maxPairs: type === "FULL" ? (m.maxPairs ?? undefined) : undefined,
      }))
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
            minPairs: m.minPairs ?? undefined,
            maxPairs: m.maxPairs ?? undefined,
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
        await ensureDraftSynced(clean)
      }

      if (step.id === "canchas" && courtsStepRef.current) {
        await courtsStepRef.current.saveAll()
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

  const step1Progress = (() => {
    const fields = [
      !!name?.trim(),
      !!startDate,
      !!endDate,
      !!venue?.trim(),
      !!tournamentClass,
      !!format,
      inscriptionPrice !== undefined && inscriptionPrice !== null && String(inscriptionPrice).length > 0,
      !!officialBall,
      !!posterUrl,
      !!matchDurationMinutes,
    ]
    const filled = fields.filter(Boolean).length
    return Math.min(100, (filled / 10) * 100)
  })()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-4 md:py-6 font-sans scrollbar-hide">
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

      {/* Stepper: línea gris fina conectando círculos numéricos (referencia WhinPadel Admin) */}
      <div className="md:hidden">
        <p className="text-sm font-medium text-foreground">
          Paso {stepIdx + 1} de {steps.length}: {step.label}
        </p>
        <Progress value={((stepIdx + 1) / steps.length) * 100} className="mt-2 h-1.5" />
      </div>
      <div className="hidden md:block overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] px-2">
          {steps.map((s, idx) => {
            const active = idx === stepIdx
            const done = idx < stepIdx
            const stepActive = active || done
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-3 group">
                  <div
                    className={
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold shadow-sm transition-colors " +
                      (stepActive ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-slate-400")
                    }
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <p className={"text-sm font-bold leading-none " + (stepActive ? "text-primary" : "text-slate-400")}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1">
                      {idx === 0 ? "Configuración" : idx === 1 ? "Niveles & Ramas" : idx === 2 ? "Canchas & Horas" : idx === 3 ? "Registro" : "Confirmar"}
                    </p>
                  </div>
                </div>
                {idx < steps.length - 1 && <div className="h-px bg-slate-200 flex-1 mx-4" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        <div className="flex-1 min-w-0 space-y-6 pb-32 md:pb-40">
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
                        type === "FULL" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                      }`}
                    >
                      {type === "FULL" && (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[9px] font-bold uppercase shadow-sm md:right-4 md:top-4 md:text-[10px]">
                          Recomendado
                        </span>
                      )}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl md:mb-4 md:h-12 md:w-12 ${type === "FULL" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
                        <Bot className="h-4 w-4 md:h-6 md:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold mb-0.5 md:mb-1 text-slate-900">Torneo Inteligente</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Gestión total: categorías, inscripciones, cuadros automáticos y rol de juegos en la plataforma.
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("BASIC")}
                      className={`relative flex flex-row items-start gap-3 rounded-xl border-2 p-4 text-left transition-all md:flex-col md:gap-0 md:p-6 ${
                        type === "BASIC" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl md:mb-4 md:h-12 md:w-12 ${type === "BASIC" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
                        <Megaphone className="h-4 w-4 md:h-6 md:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold mb-0.5 md:mb-1 text-slate-900">Solo Difusión</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
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
                  <TournamentPosterUpload
                    endpoint="/api/uploads/club/tournament-poster"
                    value={posterUrl}
                    onChange={setPosterUrl}
                  />
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
                    disabled={pairCount > 0}
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
                {pairCount > 0 && (
                  <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <Lock className="h-4 w-4 !text-amber-600" />
                    <AlertDescription>
                      Las categorías no se pueden modificar porque ya hay <strong>{pairCount}</strong> {pairCount === 1 ? "pareja inscrita" : "parejas inscritas"}. Para editarlas, primero elimina las inscripciones desde el paso de Registro.
                    </AlertDescription>
                  </Alert>
                )}
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
                    <div className="space-y-4">
                    {modalities.map((m, idx) => {
                      const usedByOthers = new Set(
                        modalities.filter((_, j) => j !== idx).map((o) => `${o.modality}::${o.category}`)
                      )
                      const modalityOptions = MODALITY_OPTIONS.filter(
                        (opt) => !usedByOthers.has(`${opt}::${m.category}`)
                      )
                      const categoryOptions = getCategoriesForModality(m.modality).filter(
                        (opt) => !usedByOthers.has(`${m.modality}::${opt}`)
                      )
                      const isDuplicate =
                        modalities.filter((o) => `${o.modality}::${o.category}` === `${m.modality}::${m.category}`)
                          .length > 1
                      const ModalityIcon =
                        m.modality === "VARONIL" ? Mars : m.modality === "FEMENIL" ? Venus : Users
                      const iconClass =
                        m.modality === "VARONIL"
                          ? "bg-primary/10 text-primary"
                          : m.modality === "FEMENIL"
                            ? "bg-pink-100 text-pink-500"
                            : "bg-purple-100 text-purple-500"
                      return (
                      <div
                        key={`${m.modality}-${m.category}-${idx}`}
                        className="rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-primary/30 transition-all bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex gap-4 items-center flex-wrap">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconClass}`}>
                              <ModalityIcon className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase">
                                  {m.modality} {m.category}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Modalidad y categoría</p>
                              </div>
                              <div className="flex gap-2">
                                <Select
                                  disabled={pairCount > 0}
                                  value={
                                    modalityOptions.includes(m.modality)
                                      ? m.modality
                                      : modalityOptions[0] ?? m.modality
                                  }
                                  onValueChange={(v: (typeof MODALITY_OPTIONS)[number]) => {
                                    const cats = getCategoriesForModality(v)
                                    const current = modalities[idx]
                                    const validCat = (cats as readonly string[]).includes(current.category) ? current.category : cats[0]
                                    setModalities((prev) => prev.map((item, i) =>
                                      i === idx ? { ...item, modality: v, category: validCat } : item
                                    ))
                                  }}
                                >
                                  <SelectTrigger className="h-9 w-[130px] bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {modalityOptions.map((opt) => (
                                      <SelectItem key={opt} value={opt}>{getCategoryLabel(opt)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  disabled={pairCount > 0}
                                  value={
                                    (categoryOptions as readonly string[]).includes(m.category)
                                      ? m.category
                                      : categoryOptions[0] ?? m.category
                                  }
                                  onValueChange={(v) =>
                                    setModalities((prev) => prev.map((it, i) => (i === idx ? { ...it, category: v } : it)))
                                  }
                                >
                                  <SelectTrigger className="h-9 min-w-[120px] bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {categoryOptions.map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {getCategoryLabel(opt)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            onClick={() => setModalities((prev) => prev.filter((_, i) => i !== idx))}
                            disabled={modalities.length <= 1 || pairCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Premio (tipo)</Label>
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
                              <SelectTrigger className="h-10 bg-slate-50 border-none"><SelectValue placeholder="Sin premio" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin premio</SelectItem>
                                <SelectItem value="CASH">Efectivo</SelectItem>
                                <SelectItem value="GIFT">Regalo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {m.prizeType === "CASH" ? (
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monto (MXN)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="h-10 bg-slate-50 border-none"
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
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mín. parejas para abrir</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  className="h-10 bg-slate-50 border-none"
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
                                <p className="text-[10px] text-slate-500">Vacío = usar 6</p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Máx. parejas (Cupo Máx)</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  className="h-10 bg-slate-50 border-none"
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
                                <p className="text-[10px] text-slate-500">Vacío = usar {maxTeams}</p>
                              </div>
                            </>
                          ) : null}
                          {m.prizeType === "GIFT" ? (
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descripcion (ej: 2 palas X, paleteros)</Label>
                              <Input
                                className="h-10 bg-slate-50 border-none"
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
                        {isDuplicate && (
                          <p className="mt-3 text-sm text-destructive">
                            Esta combinación ya existe en otra categoría. Cambia modalidad o categoría.
                          </p>
                        )}
                      </div>
                    )
                    })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Mixto usa categorías A/B/C/D. Varonil/Femenil usan 1ra-6ta, Senior e Infantil/Juvenil (10U-18U).
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          {step.id === "canchas" ? (
            tournamentId ? (
              <CourtsAndSchedulesStep
                ref={courtsStepRef}
                tournamentId={tournamentId}
                maxTeams={Number(maxTeams || 64)}
                matchDurationMinutes={Number(matchDurationMinutes || 70)}
                startDate={startDate}
                endDate={endDate}
                tournamentClass={tournamentClass}
                format={format}
                type={type}
                onCapacityChange={(total, required) => {
                  setCapacityTotal(total)
                  setCapacityRequired(required)
                }}
              />
            ) : (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
                Primero define las categorías (paso 2) para crear el borrador del torneo.
              </div>
            )
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

          {/* Footer de navegación: barra inferior fija, Siguiente en verde sólido */}
          <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white/95 backdrop-blur-md p-4 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" className="text-slate-500 hover:text-slate-800" onClick={() => router.push({ pathname: "/club", query: { section: "torneos" } } as any)}>
                Cancelar
              </Button>
              <Button type="button" variant="outline" onClick={goBack} disabled={stepIdx === 0} className="hidden sm:inline-flex">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
            </div>
            <Button type="button" className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 px-8 py-2.5 rounded-xl" onClick={goNext} disabled={stepIdx === steps.length - 1}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar: Vista Previa (oculto en Paso 4 Registro para más espacio) */}
        {step.id !== "registro" && (
        <div className="hidden lg:block w-[380px] shrink-0 sticky top-6 self-start">
          <WizardSidebar
            name={name}
            startDate={startDate}
            endDate={endDate}
            venue={venue}
            inscriptionPrice={inscriptionPrice}
            prize={prize}
            format={format}
            matchDurationMinutes={matchDurationMinutes}
            tournamentClass={tournamentClass}
            officialBall={officialBall}
            posterUrl={posterUrl}
            type={type}
            registrationOpensAt={registrationOpensAt}
            modalities={modalities.map((m) => ({
              modality: m.modality,
              category: m.category,
              minPairs: m.minPairs ?? undefined,
              maxPairs: m.maxPairs ?? undefined,
            }))}
            maxTeams={Number(maxTeams || 64)}
            courtCount={(courtsQuery.data?.data ?? []).length}
            stepId={step.id}
            progressPercent={step1Progress}
            capacityTotal={capacityTotal}
            capacityRequired={capacityRequired}
            pairCount={pairCount}
            lastPairs={lastPairs}
          />
        </div>
        )}
      </div>
    </div>
  )
}

