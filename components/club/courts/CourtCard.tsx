"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Trash2, Building2, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { formatScheduleSummaryShort } from "./schedule-summary"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { DaySchedule } from "@/components/club/weekly-schedule-editor"

export interface CourtCardProps {
  id: string
  name: string
  venue: string
  isIndoor: boolean
  schedule: DaySchedule[]
  isPrimary?: boolean
  onNameChange: (value: string) => void
  onVenueChange: (value: string) => void
  onIndoorChange: (value: boolean) => void
  onScheduleChange: (schedule: DaySchedule[]) => void
  onReplicateToAll: () => void
  onDelete: () => void
  /** Al pulsar "Editar Horarios" abre el drawer (controlado por el padre) */
  onEditSchedule: () => void
}

export function CourtCard({
  id,
  name,
  venue,
  isIndoor,
  schedule,
  isPrimary,
  onNameChange,
  onVenueChange,
  onIndoorChange,
  onScheduleChange,
  onReplicateToAll,
  onDelete,
  onEditSchedule,
}: CourtCardProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const scheduleSummaryShort = formatScheduleSummaryShort(schedule)

  return (
    <div
      className={`relative bg-white border rounded-xl overflow-hidden shadow-sm transition-all border-l-4 ${
        isPrimary ? "border-l-primary" : "border-l-slate-300"
      }`}
    >
      {/* Trash: icono sutil, minimalista */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute top-2.5 right-2.5 z-10 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50/60 transition-colors"
        aria-label="Eliminar cancha"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      <Collapsible open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex items-center gap-2 sm:gap-3 p-4 pr-10">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm shrink-0 ${
                  isPrimary ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                }`}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-base truncate">{name || "Cancha"}</p>
                {/* Interior | Exterior: minimalista */}
                <div className="flex bg-slate-100 rounded-md p-0.5 mt-1 w-fit">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onIndoorChange(true)
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-all ${
                      isIndoor
                        ? "bg-white text-primary shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Interior
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onIndoorChange(false)
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-all ${
                      !isIndoor
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Exterior
                  </button>
                </div>
              </div>
              {mobileOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
              )}
            </div>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onEditSchedule}
            >
              Editar Horarios
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Input
                  className="h-9 text-sm max-w-[8rem]"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Nombre"
                />
                <Input
                  className="h-9 text-sm max-w-[6rem]"
                  value={venue}
                  onChange={(e) => onVenueChange(e.target.value)}
                  placeholder="Sede"
                />
              </div>
              {/* Interior/Exterior: minimalista */}
              <div className="flex bg-slate-100 rounded-md p-0.5 w-fit">
                <button
                  type="button"
                  onClick={() => onIndoorChange(true)}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                    isIndoor
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Interior
                </button>
                <button
                  type="button"
                  onClick={() => onIndoorChange(false)}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                    !isIndoor
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Exterior
                </button>
              </div>
              <Button
                type="button"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 py-2 rounded-xl text-sm"
                onClick={onReplicateToAll}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copiar horario a todas
              </Button>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-medium text-slate-600 mb-1">Resumen de horario</p>
                <p className="text-sm text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                  {scheduleSummaryShort}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
