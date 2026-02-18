"use client"

import { BarChart3, CheckCircle, Info } from "lucide-react"

export interface CapacityAnalysisBlockProps {
  totalHoursAvailable: number
  requiredHours: number
  courtCount: number
  matchDurationMinutes: number
}

export function CapacityAnalysisBlock({
  totalHoursAvailable,
  requiredHours,
  courtCount,
  matchDurationMinutes,
}: CapacityAnalysisBlockProps) {
  const hasEnough = totalHoursAvailable >= requiredHours
  const progress = requiredHours > 0 ? Math.min(100, (totalHoursAvailable / requiredHours) * 100) : 0
  const totalMins = totalHoursAvailable * 60
  const matchDur = Math.max(15, matchDurationMinutes)
  const estimatedMatches = Math.floor(totalMins / matchDur)
  const marginPercent =
    requiredHours > 0 && hasEnough
      ? Math.round(((totalHoursAvailable - requiredHours) / requiredHours) * 1000) / 10
      : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg text-slate-900 font-bold uppercase tracking-tight mb-0">
          Análisis de Capacidad
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
          Cálculo en tiempo real
        </p>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase">Capacidad Total</p>
              <h4 className="text-3xl text-slate-900 font-bold">
                {Math.round(totalHoursAvailable * 10) / 10}
                <span className="text-lg ml-1 text-slate-500 font-medium">h</span>
              </h4>
            </div>
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Basado en {courtCount} cancha{courtCount !== 1 ? "s" : ""} seleccionada{courtCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-slate-100 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Partidos Est.</p>
            <p className="text-xl font-bold text-slate-900">{estimatedMatches || "—"}</p>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Suficiencia</p>
            <div className={`flex items-center gap-1.5 font-bold ${hasEnough ? "text-primary" : "text-amber-600"}`}>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{hasEnough ? "ÓPTIMO" : "FALTAN HORAS"}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Estado de Logística</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {hasEnough ? (
              <>
                Con la configuración actual de{" "}
                <span className="text-white font-medium">{Math.round(totalHoursAvailable * 10) / 10} horas</span> y{" "}
                <span className="text-white font-medium">{estimatedMatches} partidos</span>, tienes un margen de seguridad del{" "}
                <span className="text-primary font-bold">{marginPercent}%</span> para retrasos.
              </>
            ) : (
              <>
                Se requieren{" "}
                <span className="text-primary font-bold">
                  {Math.round((requiredHours - totalHoursAvailable) * 10) / 10} horas
                </span>{" "}
                adicionales. Considera añadir canchas o ampliar los horarios.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
