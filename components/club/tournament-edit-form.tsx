"use client"

import { useEffect, useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  TOURNAMENT_CLASS_OPTIONS,
  TOURNAMENT_CLASS_LABELS,
  TOURNAMENT_CLASS_POINTS,
  TOURNAMENT_CLASS_BADGE_CLASS,
  TOURNAMENT_CLASS_ICON,
  COMPETITION_CATEGORIES,
  MODALITY_OPTIONS,
} from "@/lib/tournament/categories"
import { useTournament } from "@/hooks/use-tournaments"
import { updateTournament } from "@/lib/api/tournaments"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Bot, Megaphone, MapPin, MessageCircle, Link2, Clock, Trophy, Medal, Target, Zap } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { ImageUploadField } from "@/components/club/image-upload-field"
import { DateRangePicker } from "@/components/ui/date-range-picker"

type DraftModality = {
  modality: (typeof MODALITY_OPTIONS)[number]
  category: string
  prizeType?: "CASH" | "GIFT" | null
  prizeAmount?: number | null
  prizeDescription?: string | null
  minPairs?: number | null
  maxPairs?: number | null
}

interface TournamentEditFormProps {
  tournamentId: string
}

export function TournamentEditForm({ tournamentId }: TournamentEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const tournamentQuery = useTournament(tournamentId)
  const [saving, setSaving] = useState(false)

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
  const [logoUrl, setLogoUrl] = useState("")
  const [officialBall, setOfficialBall] = useState("")
  const [supportWhatsApp, setSupportWhatsApp] = useState("")
  const [registrationOpensAt, setRegistrationOpensAt] = useState("")
  const [externalRegistrationLink, setExternalRegistrationLink] = useState("")
  const [goldenPoint, setGoldenPoint] = useState(true)
  const [thirdSetTiebreakTo10, setThirdSetTiebreakTo10] = useState(true)
  const [setTo4Games, setSetTo4Games] = useState(false)
  const [rulesPdfUrl, setRulesPdfUrl] = useState("")
  const [rulesPdfUploading, setRulesPdfUploading] = useState(false)
  const [modalities, setModalities] = useState<DraftModality[]>([])

  const tournament = tournamentQuery.data?.data
  const canEditModalities = tournament?.status === "DRAFT"
  const hasRegistrations = (tournament?.modalities ?? []).some((m: { registeredTeams: number }) => m.registeredTeams > 0)

  useEffect(() => {
    if (!tournament) return
    setName(tournament.name ?? "")
    setDescription(tournament.description ?? "")
    setVenue(tournament.venue ?? "")
    setStartDate(tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 10) : "")
    setEndDate(tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 10) : "")
    setRegistrationDeadline(
      tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().slice(0, 16) : ""
    )
    setRegistrationOpensAt(
      tournament.registrationOpensAt ? new Date(tournament.registrationOpensAt).toISOString().slice(0, 16) : ""
    )
    setOfficialBall(tournament.officialBall ?? "")
    setSupportWhatsApp(tournament.supportWhatsApp ?? "")
    setExternalRegistrationLink(tournament.externalRegistrationLink ?? "")
    const r = tournament.rules as { goldenPoint?: boolean; thirdSetTiebreakTo10?: boolean; gamesPerSet?: number } | null
    setGoldenPoint(r?.goldenPoint ?? true)
    setThirdSetTiebreakTo10(r?.thirdSetTiebreakTo10 ?? true)
    setSetTo4Games(r?.gamesPerSet === 4)
    setRulesPdfUrl(tournament.rulesPdfUrl ?? "")
    setTournamentClass(
      (() => {
        const c = tournament.category
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
      })()
    )
    setFormat((tournament.format as "ELIMINATION" | "ROUND_ROBIN" | "LEAGUE" | "EXPRESS") ?? "ROUND_ROBIN")
    setType((tournament.type as "FULL" | "BASIC") ?? "FULL")
    setInscriptionPrice(String(tournament.inscriptionPrice ?? 0))
    setMaxTeams(String(tournament.maxTeams ?? 64))
    setMatchDurationMinutes(String(tournament.matchDurationMinutes ?? 70))
    setPrize(tournament.prize ?? "")
    setPosterUrl(tournament.posterUrl ?? "")
    setLogoUrl(tournament.logoUrl ?? "")
    setModalities(
      (tournament.modalities ?? []).map(
        (m: {
          modality: string
          category: string
          prizeType?: string | null
          prizeAmount?: number | null
          prizeDescription?: string | null
          minPairs?: number | null
          maxPairs?: number | null
        }) => ({
          modality: m.modality as (typeof MODALITY_OPTIONS)[number],
          category: m.category,
          prizeType: (m.prizeType as "CASH" | "GIFT") ?? undefined,
          prizeAmount: m.prizeAmount ?? undefined,
          prizeDescription: m.prizeDescription ?? undefined,
          minPairs: m.minPairs ?? undefined,
          maxPairs: m.maxPairs ?? undefined,
        })
      )
    )
  }, [tournament])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tournament) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name,
        description: description || undefined,
        venue: venue || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
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
        rulesPdfUrl: rulesPdfUrl || undefined,
        rules: { goldenPoint, thirdSetTiebreakTo10, gamesPerSet: setTo4Games ? 4 : 6 },
        category: tournamentClass,
        format,
        type,
        inscriptionPrice: Number(inscriptionPrice || 0),
        maxTeams: Number(maxTeams || 64),
        matchDurationMinutes: Number(matchDurationMinutes || 70),
        prize: prize || undefined,
        posterUrl: posterUrl || undefined,
        logoUrl: logoUrl || undefined,
      }
      if (canEditModalities && !hasRegistrations && type === "FULL") {
        payload.modalities = modalities
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
      }
      const res = await updateTournament(tournamentId, payload)
      if (!res?.success) throw new Error(res?.error || "No se pudo guardar")
      toast({ title: "Torneo actualizado" })
      router.push({ pathname: "/club", query: { section: "torneos" } } as any)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (tournamentQuery.isLoading || !tournament) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={"/club?section=torneos" as any}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Editar torneo</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Informacion general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="mb-1.5 block">Nombre del torneo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Open SLP 2026" required />
            </div>
            <div className="space-y-2">
              <Label className="mb-1.5 block">Descripcion</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="mb-1.5 block">Clase</Label>
                <Select value={tournamentClass} onValueChange={(v: (typeof TOURNAMENT_CLASS_OPTIONS)[number]) => setTournamentClass(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOURNAMENT_CLASS_OPTIONS.map((opt) => {
                      const Icon = { Trophy, Medal, Target, Zap }[TOURNAMENT_CLASS_ICON[opt]]
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
              <div className="space-y-2">
                <Label className="mb-1.5 block">Pelota Oficial</Label>
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
              <div className="space-y-2">
                <Label className="mb-1.5 block">Tipo de torneo</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setType("FULL")}
                    className={`relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors ${
                      type === "FULL"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/20 hover:border-muted-foreground/30"
                    }`}
                  >
                    {type === "FULL" && (
                      <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        RECOMENDADO
                      </span>
                    )}
                    <Bot className={`mb-2 h-8 w-8 ${type === "FULL" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold">Torneo Inteligente</span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      Gestión total: categorías, inscripciones, cuadros automáticos y rol de juegos en la plataforma.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("BASIC")}
                    className={`relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors ${
                      type === "BASIC"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/20 hover:border-muted-foreground/30"
                    }`}
                  >
                    <Megaphone className={`mb-2 h-8 w-8 ${type === "BASIC" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold">Sólo Difusión</span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      Aparece en el calendario nacional. La gestión de inscripciones y cuadros es externa (WhatsApp/Link).
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="mb-1.5 block">Inscripción por Pareja (MXN)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input className="h-12 pl-8" type="number" min={0} value={inscriptionPrice} onChange={(e) => setInscriptionPrice(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="mb-1.5 block">Bolsa de Premios (MXN)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input className="h-12 pl-8" value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="50000" />
                </div>
              </div>
            </div>

            {/* Bloque 1: Reglamento y Reglas */}
            <div className="rounded-xl border border-border bg-slate-50 p-6 space-y-6">
              <div className="space-y-2">
                <Label className="mb-1.5 block">Reglamento del torneo</Label>
                <div className="border-2 border-dashed border-border rounded-2xl p-6 bg-background">
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
                  <Select value={format} onValueChange={(v: "ELIMINATION" | "ROUND_ROBIN" | "LEAGUE" | "EXPRESS") => setFormat(v)}>
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
                    <Input className="h-12 pl-12" type="number" min={15} max={180} value={matchDurationMinutes} onChange={(e) => setMatchDurationMinutes(e.target.value)} />
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

            {/* Bloque 2: Configuración */}
            <div className="rounded-xl border border-border bg-slate-50 p-6">
              <div className="space-y-2">
                <Label className="mb-1.5 block">Max parejas (global)</Label>
                <Input className="h-12" type="number" min={2} value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} />
                <p className="text-xs text-muted-foreground">El mínimo y máximo por categoría se configuran al agregar cada categoría.</p>
              </div>
            </div>

            {/* Bloque 3: Fechas y Logística */}
            <div className="rounded-xl border border-border bg-slate-50 p-6">
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
                    required
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
                    <Input className="h-12 pr-12" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Club / Dirección" />
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
            <div className="space-y-2">
              <Label>Cartel del torneo</Label>
              <p className="text-xs text-muted-foreground">
                Sube una imagen. Si no subes cartel, se usará la imagen del club como predeterminada.
              </p>
              <ImageUploadField
                label="Subir imagen"
                endpoint="/api/uploads/club/tournament-poster"
                value={posterUrl ? [posterUrl] : []}
                onChange={(urls) => setPosterUrl(urls[0] || "")}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo (URL)</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {canEditModalities && !hasRegistrations && type === "FULL" ? (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Categorias y modalidades</CardTitle>
              <p className="text-sm text-muted-foreground">
                Solo editable en borrador y sin parejas registradas.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {modalities.map((m, idx) => (
                <div key={idx} className="rounded-lg border border-border/50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Modalidad</Label>
                        <Select
                          value={m.modality}
                          onValueChange={(v: (typeof MODALITY_OPTIONS)[number]) =>
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
                      onClick={() => setModalities((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={modalities.length <= 1}
                    >
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
                              i === idx ? { ...it, minPairs: e.target.value ? Number(e.target.value) : undefined } : it
                            )
                          )
                        }
                      />
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
                              i === idx ? { ...it, maxPairs: e.target.value ? Number(e.target.value) : undefined } : it
                            )
                          )
                        }
                      />
                    </div>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalities((prev) => [...prev, { modality: "VARONIL", category: "4ta" }])}
              >
                Anadir categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Categorias</CardTitle>
              <p className="text-sm text-muted-foreground">
                Las categorias no se pueden editar (torneo ya publicado o con parejas registradas).
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {modalities.map((m, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border/50 px-2 py-1 text-sm">
                      {m.modality} {m.category}
                    </span>
                    {m.prizeType === "CASH" && m.prizeAmount != null ? (
                      <span className="text-xs text-muted-foreground">
                        Premio: ${m.prizeAmount} MXN
                      </span>
                    ) : null}
                    {m.prizeType === "GIFT" && m.prizeDescription ? (
                      <span className="text-xs text-muted-foreground">
                        Premio: {m.prizeDescription}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar cambios
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={"/club?section=torneos" as any}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
