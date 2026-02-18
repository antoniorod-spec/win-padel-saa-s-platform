"use client"

import {
  Calendar,
  MapPin,
  CalendarCheck,
  Clock,
  Trophy,
  ListOrdered,
} from "lucide-react"
import { TOURNAMENT_CLASS_LABELS } from "@/lib/tournament/categories"

const FORMAT_LABELS: Record<string, string> = {
  ROUND_ROBIN: "Round Robin + Playoff",
  ELIMINATION: "Eliminación Directa",
  LEAGUE: "Liga / Todos contra Todos",
  EXPRESS: "Cuadro con Consolación",
}

const BALL_LABELS: Record<string, string> = {
  HEAD_PRO_S: "Head Pro S",
  BABOLAT_COURT: "Babolat Court",
  WILSON_X3: "Wilson X3",
  OTHER: "Otra",
}

export interface TournamentPreviewCardProps {
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
  /** Porcentaje de completitud del Paso 1 (0-100) */
  progressPercent: number
}

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

function formatRegOpen(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" })
  } catch {
    return dateStr.slice(0, 10)
  }
}

export function TournamentPreviewCard({
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
  progressPercent,
}: TournamentPreviewCardProps) {
  const classLabel = TOURNAMENT_CLASS_LABELS[tournamentClass as keyof typeof TOURNAMENT_CLASS_LABELS] ?? tournamentClass
  const formatLabel = FORMAT_LABELS[format] ?? format
  const ballLabel = BALL_LABELS[officialBall] ?? (officialBall || "—")

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
      {/* Hero: poster o degradado */}
      <div className="relative h-48 min-h-[12rem] overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt="Cartel"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-primary/20 via-emerald-500/15 to-teal-600/20"
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="flex gap-1.5 flex-wrap">
            <span className="bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-lg shadow-primary/30">
              {classLabel}
            </span>
            {officialBall && (
              <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {ballLabel}
              </span>
            )}
          </div>
          <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit border border-slate-200">
            <ListOrdered className="h-3 w-3" />
            {formatLabel}
          </span>
        </div>
        {prize && Number(prize) > 0 && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-amber-400 text-slate-900 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Bolsa: ${Number(prize).toLocaleString("es-MX")} MXN
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
              Vista previa en vivo
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-1 truncate">
              {name || "Nombre del torneo"}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
              Inscripción
            </p>
            <p className="text-base font-bold text-slate-900">
              ${inscriptionPrice ? Number(inscriptionPrice).toLocaleString("es-MX") : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 min-w-0">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Torneo</p>
              <p className="text-xs font-medium truncate">
                {formatDateRange(startDate, endDate)}
              </p>
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
              <p className="text-[10px] text-slate-400 font-bold uppercase">Partido prom.</p>
              <p className="text-xs font-medium">{matchDurationMinutes || "—"} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600 min-w-0">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Formato</p>
              <p className="text-xs font-medium truncate">{formatLabel}</p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Configuración del Paso 1
            </span>
            <span className="text-xs font-bold text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
