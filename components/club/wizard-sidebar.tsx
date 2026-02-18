"use client"

import {
  Calendar,
  MapPin,
  BarChart3,
  Users,
  CalendarCheck,
  Clock,
  CheckCircle,
  Info,
  PieChart,
  ArrowRight,
  Lightbulb,
} from "lucide-react"
import { TOURNAMENT_CLASS_LABELS, TOURNAMENT_CLASS_ICON, formatModalityLabel } from "@/lib/tournament/categories"
import { Trophy, Medal, Target, Zap } from "lucide-react"
import { sanitizeLabel } from "@/lib/utils"

const FORMAT_LABELS: Record<string, string> = {
  ROUND_ROBIN: "Round Robin",
  ELIMINATION: "Eliminación Directa",
  LEAGUE: "Liga",
  EXPRESS: "Cuadro con Consolación",
}

const BALL_LABELS: Record<string, string> = {
  HEAD_PRO_S: "Head Pro S",
  BABOLAT_COURT: "Babolat Court",
  WILSON_X3: "Wilson X3",
  OTHER: "Otra",
}

const TOURNAMENT_CLASS_ICONS = { Trophy, Medal, Target, Zap } as const

/** Badge unificado: mismo font-size, padding, border-radius para todos */
const BADGE_BASE = "text-[10px] font-semibold px-2.5 py-1 rounded-lg font-sans"

function formatDateRange(from: string, to: string): string {
  if (!from || !to) return "—"
  try {
    const d1 = new Date(from)
    const d2 = new Date(to)
    const opts: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
    return `${d1.toLocaleDateString("es-MX", opts)} - ${d2.toLocaleDateString("es-MX", opts)}`
  } catch {
    return `${from} - ${to}`
  }
}

function formatRegistroAbre(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" })
  } catch {
    return dateStr.slice(0, 10)
  }
}

/** Lógica de docs/Logica-torneos.md: priorizar grupos de 3, crear de 4 cuando sobran */
function computeGroupBreakdown(N: number): {
  groupsOf3: number
  groupsOf4: number
  totalGroups: number
  qualifiers: number
  groupStageMatches: number
  finalPhaseLabel: string
} {
  if (N < 2) {
    return { groupsOf3: 0, groupsOf4: 0, totalGroups: 0, qualifiers: 0, groupStageMatches: 0, finalPhaseLabel: "—" }
  }
  let groupsOf3 = 0
  let groupsOf4 = 0
  const r = N % 3
  if (r === 0) {
    groupsOf3 = N / 3
  } else if (r === 1) {
    groupsOf3 = Math.floor((N - 4) / 3)
    groupsOf4 = 1
  } else {
    // r === 2: ej. 8→0+2, 11→1+2, 14→2+2
    groupsOf3 = Math.floor((N - 8) / 3)
    groupsOf4 = 2
  }
  const totalGroups = groupsOf3 + groupsOf4
  const qualifiers = totalGroups * 2
  const matches3 = groupsOf3 * 3
  const matches4 = groupsOf4 * 6
  const groupStageMatches = matches3 + matches4

  let finalPhaseLabel = "—"
  if (qualifiers <= 4) finalPhaseLabel = "Semifinales"
  else if (qualifiers <= 8) finalPhaseLabel = "4tos"
  else if (qualifiers <= 16) finalPhaseLabel = "8vos"
  else if (qualifiers <= 32) finalPhaseLabel = "16vos"

  return { groupsOf3, groupsOf4, totalGroups, qualifiers, groupStageMatches, finalPhaseLabel }
}

export interface WizardSidebarProps {
  /** Datos estáticos del torneo (siempre visibles) */
  name: string
  startDate: string
  endDate: string
  venue: string
  inscriptionPrice: string
  prize: string
  format: string
  matchDurationMinutes: string
  tournamentClass: string
  officialBall: string
  posterUrl: string
  type: "FULL" | "BASIC"
  /** Fecha/hora de apertura de inscripciones (registrationOpensAt) */
  registrationOpensAt: string
  modalities: Array<{ modality: string; category: string; minPairs?: number | null; maxPairs?: number | null }>
  courtCount: number
  /** Capacidad global de parejas (maxTeams) */
  maxTeams?: number
  /** Paso actual del wizard */
  stepId: string
  /** Contenido dinámico según paso */
  progressPercent?: number
  capacityTotal?: number
  capacityRequired?: number
  pairCount?: number
  /** Últimas 3 parejas para feedback visual */
  lastPairs?: Array<{ player1: string; player2: string }>
}

export function WizardSidebar({
  name,
  startDate,
  endDate,
  venue,
  inscriptionPrice,
  prize,
  format,
  matchDurationMinutes,
  tournamentClass,
  officialBall,
  posterUrl,
  type,
  registrationOpensAt,
  modalities,
  courtCount,
  stepId,
  progressPercent = 0,
  capacityTotal = 0,
  capacityRequired = 0,
  pairCount = 0,
  lastPairs = [],
  maxTeams = 64,
}: WizardSidebarProps) {
  const classLabel = TOURNAMENT_CLASS_LABELS[tournamentClass as keyof typeof TOURNAMENT_CLASS_LABELS] ?? sanitizeLabel(tournamentClass)
  const formatLabel = FORMAT_LABELS[format] ?? sanitizeLabel(format)
  const ballLabel = BALL_LABELS[officialBall] ?? (officialBall || "—")
  const iconName = TOURNAMENT_CLASS_ICON[tournamentClass as keyof typeof TOURNAMENT_CLASS_ICON]
  const IconClass = (iconName && TOURNAMENT_CLASS_ICONS[iconName as keyof typeof TOURNAMENT_CLASS_ICONS]) ?? Trophy

  const typeLabel = type === "FULL" ? "Torneo Inteligente" : "Solo Difusión"

  return (
    <div className="w-full">
      {/* Contenedor principal: estilo Pro con degradado */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 font-sans">
        {/* Hero: poster o degradado (sin badges, limpio) */}
        <div className="relative h-40 min-h-[10rem] overflow-hidden">
          {posterUrl ? (
            <img src={posterUrl} alt="Cartel" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full bg-gradient-to-br from-primary/20 via-emerald-500/15 to-teal-600/20"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {prize && Number(prize) > 0 && (
            <div className="absolute bottom-3 left-3">
              <div className={`${BADGE_BASE} bg-amber-400 text-slate-900 shadow-lg flex items-center gap-1.5`}>
                <Trophy className="h-3.5 w-3.5" />
                Bolsa: ${Number(prize).toLocaleString("es-MX")} MXN
              </div>
            </div>
          )}
        </div>

        {/* Hero Card: badges unificados + nombre, inscripción + 4 datos clave */}
        <div className="p-5 border-b border-slate-100">
          {/* Badges: Anual, Round Robin, Torneo Inteligente - misma línea, mismo estilo */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`${BADGE_BASE} bg-primary/10 text-primary border border-primary/20`}>
              {classLabel}
            </span>
            <span className={`${BADGE_BASE} bg-slate-100 text-slate-700 border border-slate-200`}>
              {formatLabel}
            </span>
            <span className={`${BADGE_BASE} bg-slate-100 text-slate-700 border border-slate-200`}>
              {typeLabel}
            </span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Vista previa en vivo</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1 truncate">{name || "Nombre del torneo"}</h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Inscripción</p>
              <p className="text-base font-bold text-slate-900">
                ${inscriptionPrice ? Number(inscriptionPrice).toLocaleString("es-MX") : "—"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Torneo</p>
                <p className="text-xs font-medium truncate">{formatDateRange(startDate, endDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Sede</p>
                <p className="text-xs font-medium truncate">{venue || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <CalendarCheck className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Registro abre</p>
                <p className="text-xs font-medium truncate">{formatRegistroAbre(registrationOpensAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Partido prom.</p>
                <p className="text-xs font-medium">{matchDurationMinutes || "—"} min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Parte dinámica según paso */}
        <div className="p-5 space-y-4">
          {stepId === "general" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Configuración del Paso 1</span>
                <span className="text-xs font-bold text-primary">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>
          )}

          {(stepId === "categorias" || stepId === "canchas" || stepId === "registro" || stepId === "revision") && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Categorías</p>
              <div className="flex flex-wrap gap-1.5">
                {modalities.length === 0 ? (
                  <span className="text-xs text-slate-500">Sin categorías</span>
                ) : (
                  modalities.map((m, i) => (
                    <span
                      key={`${m.modality}-${m.category}-${i}`}
                      className={`${BADGE_BASE} bg-slate-50 text-slate-700 border border-slate-200`}
                    >
                      {sanitizeLabel(formatModalityLabel(m.modality, m.category))}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {(stepId === "canchas" || stepId === "registro" || stepId === "revision") && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Canchas</p>
              <p className="text-lg font-bold text-slate-900">{courtCount}</p>
            </div>
          )}

          {stepId === "canchas" && (
            <div className="space-y-4">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Análisis de Capacidad</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Cálculo en tiempo real</p>
              </div>
              <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase">Capacidad Total</p>
                    <h4 className="text-2xl text-slate-900 font-display">
                      {Math.round(capacityTotal * 10) / 10}
                      <span className="text-base ml-1 text-slate-500">h</span>
                    </h4>
                  </div>
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${capacityRequired > 0 ? Math.min(100, (capacityTotal / capacityRequired) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  Basado en {courtCount} cancha{courtCount !== 1 ? "s" : ""} seleccionada{courtCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Partidos Est.</p>
                  <p className="text-xl font-bold text-slate-900 font-display">
                    {(() => {
                      const matchDur = Number(matchDurationMinutes) || 70
                      const totalMins = capacityTotal * 60
                      return matchDur > 0 ? Math.floor(totalMins / matchDur) : "—"
                    })()}
                  </p>
                </div>
                <div className="p-4 border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Suficiencia</p>
                  <div className={`flex items-center gap-1.5 font-bold ${capacityTotal >= capacityRequired ? "text-primary" : "text-amber-600"}`}>
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-display">
                      {capacityTotal >= capacityRequired ? "ÓPTIMO" : "FALTAN HORAS"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Estado de Logística</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {capacityTotal >= capacityRequired ? (
                    <>
                      Con la configuración actual de{" "}
                      <span className="text-white">{Math.round(capacityTotal * 10) / 10} horas</span> y{" "}
                      <span className="text-white">
                        {(() => {
                          const matchDur = Number(matchDurationMinutes) || 70
                          const totalMins = capacityTotal * 60
                          const partidos = matchDur > 0 ? Math.floor(totalMins / matchDur) : 0
                          return partidos
                        })()}{" "}
                        partidos
                      </span>
                      , tienes un margen de seguridad del{" "}
                      <span className="text-primary font-bold">
                        {capacityRequired > 0
                          ? `${Math.round(((capacityTotal - capacityRequired) / capacityRequired) * 100)}%`
                          : "0%"}
                      </span>{" "}
                      para retrasos.
                    </>
                  ) : (
                    <>
                      Se requieren{" "}
                      <span className="text-primary font-bold">
                        {Math.round((capacityRequired - capacityTotal) * 10) / 10} horas
                      </span>{" "}
                      adicionales. Considera añadir canchas o ampliar los horarios.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {(stepId === "registro" || stepId === "revision") && type === "FULL" && (
            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Parejas inscritas</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{pairCount}</p>
              {lastPairs.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {lastPairs.slice(0, 3).map((p, i) => (
                    <p key={i} className="text-[10px] text-slate-400 truncate">
                      {p.player1} / {p.player2}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Desglose del Torneo: solo FULL + ROUND_ROBIN + categorías */}
          {type === "FULL" &&
            format === "ROUND_ROBIN" &&
            modalities.length > 0 &&
            (stepId === "categorias" || stepId === "canchas" || stepId === "registro" || stepId === "revision") && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Desglose del Torneo</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Capacidad Global</p>
                    <p className="text-lg font-bold text-slate-900 font-display">
                      {pairCount} / {maxTeams} Parejas
                    </p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{
                          width: `${maxTeams > 0 ? Math.min(100, (pairCount / maxTeams) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  {modalities.map((m, idx) => {
                    const cupo = m.maxPairs ?? Math.floor(maxTeams / modalities.length)
                    if (cupo < 2) return null
                    const b = computeGroupBreakdown(cupo)
                    const modalityColor =
                      m.modality === "VARONIL" ? "text-blue-600" : m.modality === "FEMENIL" ? "text-pink-600" : "text-purple-600"
                    const gamesNote =
                      b.groupsOf4 > 0 && b.groupsOf3 > 0
                        ? "Grupos de 4: 3 juegos. Grupos de 3: 2 juegos."
                        : b.groupsOf4 > 0
                          ? "3 juegos garantizados por pareja"
                          : "2 juegos garantizados por pareja"
                    return (
                      <div key={`${m.modality}-${m.category}-${idx}`} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${modalityColor}`}>
                            {sanitizeLabel(formatModalityLabel(m.modality, m.category))}
                          </span>
                          <span className="text-xs text-slate-500">{cupo} Parejas</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {b.groupsOf4 > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200">
                              <span className="font-bold text-slate-900">{b.groupsOf4}</span>
                              <span className="text-slate-500">GRUPOS DE 4</span>
                            </span>
                          )}
                          {b.groupsOf3 > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200">
                              <span className="font-bold text-slate-900">{b.groupsOf3}</span>
                              <span className="text-slate-500">GRUPOS DE 3</span>
                            </span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200">
                            <span className="font-bold text-slate-900">{b.qualifiers}</span>
                            <span className="text-slate-500">CLASIFICADOS</span>
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="font-bold text-primary">{b.finalPhaseLabel}</span>
                            <span className="text-primary/80">FASE FINAL</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">{gamesNote}</p>
                      </div>
                    )
                  })}
                  {(() => {
                    const totalMatches = modalities.reduce((acc, m) => {
                      const cupo = m.maxPairs ?? Math.floor(maxTeams / modalities.length)
                      if (cupo < 2) return acc
                      const b = computeGroupBreakdown(cupo)
                      const playoffMatches = Math.max(0, b.qualifiers - 1)
                      return acc + b.groupStageMatches + playoffMatches
                    }, 0)
                    return (
                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Total de Partidos</span>
                        </div>
                        <span className="text-lg font-bold text-primary font-display">
                          {totalMatches} Juegos <span className="text-xs font-normal text-slate-400">(Est.)</span>
                        </span>
                      </div>
                    )
                  })()}
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Pro Tip</h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        En fase de grupos: <strong>grupos de 4</strong> garantizan <strong>3 juegos</strong> por pareja;{" "}
                        <strong>grupos de 3</strong> garantizan <strong>2 juegos</strong>. Considera grupos de 4 si tienes
                        disponibilidad amplia de pistas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
