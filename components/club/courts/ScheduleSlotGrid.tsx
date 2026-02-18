"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Copy, ChevronLeft, ChevronRight, Plus, Trash2, CheckCheck, X, Pencil } from "lucide-react"
import {
  generateTimeSlots,
  getSelectedBlocksForDay,
  updateScheduleForDay,
  replicateScheduleToRemainingDays,
  replicateScheduleToSameDayNextWeek,
  type TournamentDate,
} from "./slot-utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DaySchedule, ScheduleDay } from "@/components/club/weekly-schedule-editor"

/** Parse "HH:MM" to minutes since midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Convert minutes since midnight to "HH:MM" */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Normaliza input a HH:MM válido (ej: "1630" or "16:30" → "16:30") */
function parseAndFormatTime(val: string): string | null {
  const digits = val.replace(/\D/g, "")
  if (digits.length >= 4) {
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10) || 0)
    const m = Math.min(59, parseInt(digits.slice(2, 4), 10) || 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
  if (digits.length >= 2) {
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10) || 0)
    return `${String(h).padStart(2, "0")}:00`
  }
  return null
}

export interface ScheduleSlotGridProps {
  schedule: DaySchedule[]
  onScheduleChange: (schedule: DaySchedule[]) => void
  /** Duración del partido en minutos (del Paso 1) */
  matchDurationMinutes: number
  /** Fechas dinámicas del torneo (startDate a endDate) */
  tournamentDates: TournamentDate[]
  /** Fecha seleccionada (YYYY-MM-DD) */
  selectedDate: string
  onSelectedDateChange: (date: string) => void
  /** Columnas para móvil (3) o desktop */
  gridCols?: "grid-cols-3" | "grid-cols-3 sm:grid-cols-2 lg:grid-cols-3"
  /** Horas bloqueadas (no seleccionables) - índices de slot */
  blockedHours?: Set<number>
  /** Scroll horizontal en tabs (para móvil con muchos días) */
  tabsScrollable?: boolean
  /** Partidos asignados por hora de inicio (ej: { "16:30": { teamA: "P1/P2", teamB: "P3/P4" } }) para mostrar parejas */
  slotMatches?: Record<string, { teamA: string; teamB: string }>
}

export function ScheduleSlotGrid({
  schedule,
  onScheduleChange,
  matchDurationMinutes,
  tournamentDates,
  selectedDate,
  onSelectedDateChange,
  gridCols = "grid-cols-3 sm:grid-cols-2 lg:grid-cols-3",
  blockedHours = new Set(),
  tabsScrollable = false,
  slotMatches,
}: ScheduleSlotGridProps) {
  const timeSlots = generateTimeSlots(matchDurationMinutes)
  const stripRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [copyPopoverOpen, setCopyPopoverOpen] = useState(false)
  const [editModalSlotIdx, setEditModalSlotIdx] = useState<number | null>(null)
  const [editModalStart, setEditModalStart] = useState("")

  const selectedDay = tournamentDates.find((d) => d.date === selectedDate)
  const scheduleDay: ScheduleDay | null = selectedDay?.scheduleDay ?? null

  // Get the current day's slots for the editable list (solo se usa start; end se calcula como start + duración)
  const currentDaySlots = useMemo(() => {
    if (!scheduleDay) return []
    const dayEntry = schedule.find((d) => d.day === scheduleDay)
    if (!dayEntry || dayEntry.closed) return []
    return dayEntry.slots.filter((s) => s.start)
  }, [schedule, scheduleDay])

  // Índices de slots que se solapan. En pádel solo hay hora de inicio; el fin = inicio + matchDurationMinutes (ej. 70 min)
  const overlappingSlotIndices = useMemo(() => {
    const set = new Set<number>()
    const duration = matchDurationMinutes
    for (let i = 0; i < currentDaySlots.length; i++) {
      const aStart = timeToMinutes(currentDaySlots[i].start)
      const aEnd = aStart + duration
      for (let j = 0; j < currentDaySlots.length; j++) {
        if (i === j) continue
        const bStart = timeToMinutes(currentDaySlots[j].start)
        const bEnd = bStart + duration
        if (aStart < bEnd && bStart < aEnd) {
          set.add(i)
          set.add(j)
          break
        }
      }
    }
    return set
  }, [currentDaySlots, matchDurationMinutes])


  function checkScroll() {
    const el = stripRef.current
    if (!el) return
    const overflow = el.scrollWidth > el.clientWidth + 2
    setHasOverflow(overflow)
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }

  useEffect(() => {
    checkScroll()
    const el = stripRef.current
    if (!el) return
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    el.addEventListener("scroll", checkScroll)
    return () => {
      ro.disconnect()
      el.removeEventListener("scroll", checkScroll)
    }
  }, [tournamentDates])

  function selectAllSlots() {
    if (!scheduleDay) return
    const allIndices = new Set(timeSlots.map((s) => s.index))
    const nextSchedule = updateScheduleForDay(schedule, scheduleDay, allIndices, matchDurationMinutes)
    onScheduleChange(nextSchedule)
  }

  function deselectAllSlots() {
    if (!scheduleDay) return
    const nextSchedule = schedule.map((d) => {
      if (d.day !== scheduleDay) return d
      return { ...d, closed: true, slots: [] }
    })
    onScheduleChange(nextSchedule)
  }

  function openEditModal(idx: number) {
    const slot = currentDaySlots[idx]
    if (slot) {
      setEditModalSlotIdx(idx)
      setEditModalStart(slot.start)
    }
  }

  function saveEditModal() {
    if (editModalSlotIdx === null || !scheduleDay) return
    const start = parseAndFormatTime(editModalStart)
    if (start) {
      const startMins = timeToMinutes(start)
      const endMins = startMins + matchDurationMinutes
      const end = minutesToTime(Math.min(endMins, 24 * 60 - 1))
      const nextSchedule = schedule.map((d) => {
        if (d.day !== scheduleDay) return d
        const nextSlots = d.slots.map((s, i) =>
          i === editModalSlotIdx ? { ...s, start, end } : s
        )
        return { ...d, slots: nextSlots }
      })
      onScheduleChange(nextSchedule)
    }
    setEditModalSlotIdx(null)
  }

  function scrollStrip(direction: "left" | "right") {
    const el = stripRef.current
    if (!el) return
    const step = el.clientWidth * 0.6
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" })
  }

  function handleReplicateToRemaining() {
    const next = replicateScheduleToRemainingDays(
      schedule,
      selectedDate,
      tournamentDates,
      matchDurationMinutes
    )
    onScheduleChange(next)
    setCopyPopoverOpen(false)
  }

  function handleReplicateToSameDayNextWeek() {
    const next = replicateScheduleToSameDayNextWeek(
      schedule,
      selectedDate,
      tournamentDates,
      matchDurationMinutes
    )
    onScheduleChange(next)
    setCopyPopoverOpen(false)
  }

  /** Remove a specific slot by index */
  function removeSlot(slotIdx: number) {
    if (!scheduleDay) return
    const nextSchedule = schedule.map((d) => {
      if (d.day !== scheduleDay) return d
      const nextSlots = d.slots.filter((_, i) => i !== slotIdx)
      return { ...d, closed: nextSlots.length === 0, slots: nextSlots }
    })
    onScheduleChange(nextSchedule)
  }

  /** Add a custom slot: siguiente inicio = último inicio + duración (solo se edita hora de inicio) */
  function addCustomSlot() {
    if (!scheduleDay) return
    const lastSlot = currentDaySlots[currentDaySlots.length - 1]
    const lastStartMins = lastSlot ? timeToMinutes(lastSlot.start) : 8 * 60
    const nextStartMins = lastStartMins + matchDurationMinutes
    const defaultStart = minutesToTime(Math.min(nextStartMins, 23 * 60))
    const defaultEnd = minutesToTime(Math.min(nextStartMins + matchDurationMinutes, 24 * 60 - 1))

    const nextSchedule = schedule.map((d) => {
      if (d.day !== scheduleDay) return d
      return {
        ...d,
        closed: false,
        slots: [...d.slots, { start: defaultStart, end: defaultEnd }],
      }
    })
    onScheduleChange(nextSchedule)
  }

  const selectedIdx = tournamentDates.findIndex((d) => d.date === selectedDate)
  const hasRemainingDays = selectedIdx >= 0 && selectedIdx < tournamentDates.length - 1
  const hasSameDayNextWeek = tournamentDates.some(
    (d, i) => i > selectedIdx && d.scheduleDay === selectedDay?.scheduleDay
  )

  return (
    <div className="space-y-6">
      {/* 2. Date Strip */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-sans">
          2. Seleccionar Día
        </h3>
        <div className="relative">
          {hasOverflow && tournamentDates.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => scrollStrip("left")}
                className={`hidden lg:flex absolute left-0 top-0 bottom-0 z-10 w-8 items-center justify-center bg-gradient-to-r from-white via-white/95 to-transparent transition-opacity ${
                  canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => scrollStrip("right")}
                className={`hidden lg:flex absolute right-0 top-0 bottom-0 z-10 w-8 items-center justify-center bg-gradient-to-l from-white via-white/95 to-transparent transition-opacity ${
                  canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-label="Siguiente"
              >
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </button>
            </>
          )}

          <div
            ref={stripRef}
            className={`flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-1 ${
              tournamentDates.length > 5 ? "lg:px-10" : ""
            } ${tabsScrollable ? "scroll-smooth" : ""}`}
            style={{ scrollBehavior: "smooth" }}
          >
            {tournamentDates.length === 0 ? (
              <p className="py-3 text-sm text-slate-500">
                Define las fechas del torneo en el Paso 1 para ver los días disponibles.
              </p>
            ) : (
              tournamentDates.map(({ date, dayShort, dayNum, scheduleDay: sd }) => {
                const isSelected = selectedDate === date
                const dayBlocks = getSelectedBlocksForDay(
                  schedule,
                  sd,
                  matchDurationMinutes
                )
                const dayEntry = schedule.find((d) => d.day === sd)
                const totalSlots = dayEntry?.slots?.length ?? 0
                const hasConfig = dayBlocks.size > 0 || totalSlots > 0

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onSelectedDateChange(date)}
                    className={`shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] py-2.5 px-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {dayShort}
                    </span>
                    <span className="text-base font-display font-bold mt-0.5">{dayNum}</span>
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full ${
                        hasConfig ? "bg-primary" : "bg-slate-200"
                      }`}
                    />
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Grilla de Horarios (muestra los horarios reales; toca para editar) */}
      {scheduleDay !== null && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                3. Horarios
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px] gap-1 px-2.5"
                onClick={selectAllSlots}
                title="Rellenar con bloques estándar"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Rellenar estándar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px] gap-1 px-2.5"
                onClick={deselectAllSlots}
                title="Quitar todos"
              >
                <X className="h-3.5 w-3.5" />
                Quitar todos
              </Button>
              <Popover open={copyPopoverOpen} onOpenChange={setCopyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-lg" title="Replicar horario">
                    <Copy className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-xl" align="start">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Replicar horario de hoy a...</p>
                  <button
                    type="button"
                    onClick={handleReplicateToRemaining}
                    disabled={!hasRemainingDays}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Todos los días restantes
                  </button>
                  <button
                    type="button"
                    onClick={handleReplicateToSameDayNextWeek}
                    disabled={!hasSameDayNextWeek}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mismo día de la próxima semana
                  </button>
                </PopoverContent>
              </Popover>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={addCustomSlot}>
              <Plus className="h-3.5 w-3.5" />
              Agregar horario
            </Button>
          </div>

          {currentDaySlots.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500 mb-3">No hay horarios. Rellena con bloques estándar o agrega uno.</p>
              <Button variant="outline" size="sm" onClick={selectAllSlots}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Rellenar estándar
              </Button>
            </div>
          ) : (
            <div className={`grid ${gridCols} gap-2`}>
              {currentDaySlots.map((slot, idx) => {
                const hasOverlap = overlappingSlotIndices.has(idx)
                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => openEditModal(idx)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openEditModal(idx))}
                    className={`relative rounded-xl p-3 flex flex-col items-start justify-center border-2 shadow-sm transition-all min-h-12 text-left font-bold cursor-pointer ${
                      hasOverlap
                        ? "border-red-400 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-primary bg-primary/10 text-primary hover:bg-primary/15"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-display font-bold text-base">{slot.start}</span>
                      <Pencil className="h-4 w-4 shrink-0 opacity-70" />
                    </div>
                    {slotMatches?.[slot.start] ? (
                      <span className="text-[10px] opacity-90 mt-0.5 line-clamp-2">
                        {slotMatches[slot.start].teamA} vs {slotMatches[slot.start].teamB}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSlot(idx)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal editar horario */}
      <Dialog open={editModalSlotIdx !== null} onOpenChange={(open) => !open && setEditModalSlotIdx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar horario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-16">Hora inicio</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="08:00"
                value={editModalStart}
                onChange={(e) => setEditModalStart(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-slate-500">
              Formato HH:MM (ej. 16:30). El fin se calcula automáticamente (+{matchDurationMinutes} min).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalSlotIdx(null)}>Cancelar</Button>
            <Button onClick={saveEditModal}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
