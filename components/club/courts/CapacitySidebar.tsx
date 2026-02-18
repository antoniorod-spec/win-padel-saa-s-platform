"use client"

import { BarChart3, CheckCircle, Info } from "lucide-react"

export interface CapacitySidebarProps {
  totalHoursAvailable: number
  requiredHours: number
  courtCount?: number
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function slotHours(start: string, end: string): number {
  const s = parseTimeToMinutes(start)
  const e = parseTimeToMinutes(end)
  return Math.max(0, (e - s) / 60)
}

export function sumHoursFromSchedule(
  schedule: Array<{ day: string; closed: boolean; slots: Array<{ start: string; end: string }> }>
): number {
  let total = 0
  for (const day of schedule) {
    if (day.closed || !day.slots?.length) continue
    for (const slot of day.slots) {
      if (slot.start && slot.end) {
        total += slotHours(slot.start, slot.end)
      }
    }
  }
  return total
}

export function CapacitySidebar({
  totalHoursAvailable,
  requiredHours,
  courtCount = 0,
}: CapacitySidebarProps) {
  const hasEnough = totalHoursAvailable >= requiredHours
  const progress = requiredHours > 0 ? Math.min(100, (totalHoursAvailable / requiredHours) * 100) : 0
  const estimatedMatches = Math.floor(totalHoursAvailable / (requiredHours / 42)) // aprox partidos

  return (
    <div className="lg:sticky lg:top-24 space-y-6">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h3 className="text-lg text-slate-900 font-display uppercase tracking-tight mb-0">
            Análisis de Capacidad
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Cálculo en tiempo real
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase">Capacidad Total</p>
                <h4 className="text-3xl text-slate-900 font-display">
                  {Math.round(totalHoursAvailable * 10) / 10}
                  <span className="text-lg ml-1 text-slate-500 font-sans">h</span>
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
              <p className="text-xl font-bold text-slate-900 font-display">
                {Math.round(estimatedMatches) || "—"}
              </p>
            </div>
            <div className="p-4 border border-slate-100 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Suficiencia</p>
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-display">
                  {hasEnough ? "ÓPTIMO" : "FALTA"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Estado de Logística
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {hasEnough ? (
                <>
                  Con la configuración actual de{" "}
                  <span className="text-white">
                    {Math.round(totalHoursAvailable * 10) / 10} horas
                  </span>{" "}
                  tienes capacidad suficiente para los partidos estimados.
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

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-primary uppercase tracking-tight">
            Cálculo en Tiempo Real
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            El resumen se actualiza automáticamente al modificar los bloques de cada día.
          </p>
        </div>
      </div>
    </div>
  )
}
