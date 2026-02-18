"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, Circle, Building2, Trash2, Copy } from "lucide-react"
import { CourtCard, sumHoursFromSchedule } from "./index"
import {
  TOURNAMENT_CLASS_LABELS,
  TOURNAMENT_CLASS_BADGE_CLASS,
  TOURNAMENT_CLASS_ICON,
} from "@/lib/tournament/categories"
import { sanitizeLabel } from "@/lib/utils"
import { Trophy, Medal, Target, Zap } from "lucide-react"
import { ScheduleSlotGrid } from "./ScheduleSlotGrid"
import { ScheduleEditorDrawer } from "./ScheduleEditorDrawer"
import { generateTimeSlots, getTournamentDates } from "./slot-utils"
import {
  type DaySchedule,
  type ScheduleDay,
} from "@/components/club/weekly-schedule-editor"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateTournamentCourt,
  useDeleteTournamentCourt,
  useSetTournamentCourtAvailability,
  useTournamentCourts,
  useTournamentSchedule,
} from "@/hooks/use-tournaments"
import { updateTournamentCourt } from "@/lib/api/tournaments"

const SCHEDULE_DAYS: ScheduleDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]

function dayOfWeekToScheduleDay(dow: number): ScheduleDay {
  const map: Record<number, ScheduleDay> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  }
  return map[dow] ?? "MONDAY"
}

function scheduleDayToDayOfWeek(day: ScheduleDay): number {
  const map: Record<ScheduleDay, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  }
  return map[day]
}

/** Parsea HH:MM a minutos desde medianoche */
function timeToMins(t: string): number {
  const [h, m] = (t || "00:00").split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function buildScheduleFromAvailabilities(
  availabilities: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  matchDurationMinutes: number
): DaySchedule[] {
  const byDay: Record<number, Array<{ start: string; end: string }>> = {}
  for (let i = 0; i <= 6; i++) byDay[i] = []

  for (const a of availabilities) {
    if (!a.startTime) continue
    const startMins = timeToMins(a.startTime)
    const endMins = startMins + matchDurationMinutes
    const end = minsToTime(Math.min(endMins, 24 * 60 - 1))
    byDay[a.dayOfWeek].push({ start: a.startTime, end })
  }

  return SCHEDULE_DAYS.map((day) => {
    const dow = scheduleDayToDayOfWeek(day)
    const slots = byDay[dow].filter((s) => s.start)
    return {
      day,
      closed: slots.length === 0,
      slots: slots.length ? slots : [],
    }
  })
}

function buildAvailabilitiesFromSchedule(schedule: DaySchedule[]) {
  const items: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = []
  for (const day of schedule) {
    if (day.closed) continue
    const dayOfWeek = scheduleDayToDayOfWeek(day.day)
    for (const slot of day.slots) {
      if (!slot.start || !slot.end) continue
      items.push({ dayOfWeek, startTime: slot.start, endTime: slot.end })
    }
  }
  return items
}

/** Builds a default schedule with ALL grid slots pre-selected for every day */
function allSlotsSelectedSchedule(matchDurationMinutes: number): DaySchedule[] {
  const timeSlots = generateTimeSlots(matchDurationMinutes)
  const slots = timeSlots.map((s) => ({ start: s.start, end: s.end }))
  return SCHEDULE_DAYS.map((day) => ({
    day,
    closed: false,
    slots: [...slots],
  }))
}

const TOURNAMENT_CLASS_ICONS = { Trophy, Medal, Target, Zap } as const

export interface CourtsAndSchedulesStepProps {
  tournamentId: string
  maxTeams: number
  matchDurationMinutes: number
  startDate: string
  endDate: string
  tournamentClass?: string
  format?: string
  type?: "FULL" | "BASIC"
  onCapacityChange?: (totalHoursAvailable: number, requiredHours: number) => void
}

export interface CourtsAndSchedulesStepHandle {
  saveAll: () => Promise<void>
}

type CourtState = {
  id: string
  name: string
  venue: string
  isIndoor: boolean
  schedule: DaySchedule[]
}

export const CourtsAndSchedulesStep = forwardRef<CourtsAndSchedulesStepHandle, CourtsAndSchedulesStepProps>(function CourtsAndSchedulesStep({
  tournamentId,
  maxTeams,
  matchDurationMinutes,
  startDate,
  endDate,
  tournamentClass = "REGULAR",
  format = "ROUND_ROBIN",
  type = "FULL",
  onCapacityChange,
}, ref) {
  const { toast } = useToast()
  const courtsQuery = useTournamentCourts(tournamentId)
  const createCourt = useCreateTournamentCourt()
  const deleteCourt = useDeleteTournamentCourt()
  const setAvailability = useSetTournamentCourtAvailability()

  const courts = courtsQuery.data?.data ?? []

  const [courtStates, setCourtStates] = useState<CourtState[]>([])
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [mobileDrawerCourtId, setMobileDrawerCourtId] = useState<string | null>(null)

  const tournamentDates = useMemo(
    () => getTournamentDates(startDate, endDate),
    [startDate, endDate]
  )

  useEffect(() => {
    if (tournamentDates.length > 0 && !selectedDate) {
      setSelectedDate(tournamentDates[0].date)
    }
  }, [tournamentDates, selectedDate])

  useEffect(() => {
    if (courts.length === 0) {
      setCourtStates([])
      setSelectedCourtId(null)
      return
    }
    setCourtStates((prev) => {
      const next: CourtState[] = courts.map((c: any) => {
        const existing = prev.find((p) => p.id === c.id)
        if (existing) return existing
        const availabilities = c.availabilities ?? []
        const schedule =
          availabilities.length > 0
            ? buildScheduleFromAvailabilities(
                availabilities.map((a: any) => ({
                  dayOfWeek: a.dayOfWeek,
                  startTime: a.startTime,
                  endTime: a.endTime,
                })),
                matchDurationMinutes
              )
            : allSlotsSelectedSchedule(matchDurationMinutes)
        return {
          id: c.id,
          name: c.name,
          venue: c.venue ?? "",
          isIndoor: c.isIndoor ?? false,
          schedule,
        }
      })
      return next
    })
    if (!selectedCourtId && courts.length > 0) {
      setSelectedCourtId(courts[0].id)
    }
  }, [courts, matchDurationMinutes])

  const scheduleQuery = useTournamentSchedule(tournamentId, {
    courtId: selectedCourtId ?? undefined,
    date: selectedDate || undefined,
  })
  const slotMatches = useMemo(() => {
    const matches = Array.isArray(scheduleQuery.data?.data) ? scheduleQuery.data.data : []
    const map: Record<string, { teamA: string; teamB: string }> = {}
    for (const m of matches) {
      const startTime = m?.slot?.startTime
      if (!startTime) continue
      const a = m.teamARegistration
      const b = m.teamBRegistration
      const aName = a
        ? `${a.player1?.firstName ?? ""} ${a.player1?.lastName ?? ""} / ${a.player2?.firstName ?? ""} ${a.player2?.lastName ?? ""}`.trim() || "TBD"
        : "TBD"
      const bName = b
        ? `${b.player1?.firstName ?? ""} ${b.player1?.lastName ?? ""} / ${b.player2?.firstName ?? ""} ${b.player2?.lastName ?? ""}`.trim() || "TBD"
        : "TBD"
      map[startTime] = { teamA: aName, teamB: bName }
    }
    return map
  }, [scheduleQuery.data?.data])

  const totalHoursAvailable = useMemo(() => {
    return courtStates.reduce((acc, c) => acc + sumHoursFromSchedule(c.schedule), 0)
  }, [courtStates])

  const requiredHours = useMemo(() => {
    const pairs = Math.ceil(maxTeams / 2)
    const matchHours = matchDurationMinutes / 60
    const estimatedMatches = pairs * 4
    return Math.ceil(estimatedMatches * matchHours)
  }, [maxTeams, matchDurationMinutes])

  useEffect(() => {
    onCapacityChange?.(totalHoursAvailable, requiredHours)
  }, [totalHoursAvailable, requiredHours, onCapacityChange])

  useImperativeHandle(ref, () => ({
    saveAll: () => handleSaveAllSchedules(),
  }))

  function updateCourtState(courtId: string, updater: (c: CourtState) => CourtState) {
    setCourtStates((prev) => prev.map((c) => (c.id === courtId ? updater(c) : c)))
  }

  async function handleSaveAllSchedules() {
    setSaving(true)
    try {
      for (const court of courtStates) {
        await updateTournamentCourt(tournamentId, court.id, {
          name: court.name,
          venue: court.venue,
          isIndoor: court.isIndoor,
        })
        const availabilities = buildAvailabilitiesFromSchedule(court.schedule)
        await setAvailability.mutateAsync({
          tournamentId,
          courtId: court.id,
          availabilities,
        })
      }
      courtsQuery.refetch()
      toast({ title: "Horarios y canchas guardados" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudieron guardar los horarios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleReplicateToAll(sourceCourtId: string) {
    const source = courtStates.find((c) => c.id === sourceCourtId)
    if (!source) return
    setCourtStates((prev) =>
      prev.map((c) => (c.id === sourceCourtId ? c : { ...c, schedule: [...source.schedule] }))
    )
    toast({ title: "Configuración replicada a todas las canchas" })
  }

  async function handleDeleteCourt(courtId: string) {
    try {
      await deleteCourt.mutateAsync({ tournamentId, courtId })
      setCourtStates((prev) => prev.filter((c) => c.id !== courtId))
      if (selectedCourtId === courtId) {
        const remaining = courtStates.filter((c) => c.id !== courtId)
        setSelectedCourtId(remaining[0]?.id ?? null)
      }
      toast({ title: "Cancha eliminada" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo eliminar",
        variant: "destructive",
      })
    }
  }

  const selectedCourt = courtStates.find((c) => c.id === selectedCourtId)

  const classLabel = TOURNAMENT_CLASS_LABELS[tournamentClass as keyof typeof TOURNAMENT_CLASS_LABELS] ?? tournamentClass
  const iconName = TOURNAMENT_CLASS_ICON[tournamentClass as keyof typeof TOURNAMENT_CLASS_ICON]
  const IconClass = (iconName && TOURNAMENT_CLASS_ICONS[iconName as keyof typeof TOURNAMENT_CLASS_ICONS]) ?? Trophy

  const BADGE_BASE = "text-[10px] font-semibold px-2.5 py-1 rounded-lg font-sans"

  return (
    <div className="space-y-6 font-sans">
      {/* Desktop: Layout unificado - cabecera mismo peso que Configuración General */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 font-display">
                Disponibilidad de Canchas
              </h1>
              <span className={`${BADGE_BASE} ${TOURNAMENT_CLASS_BADGE_CLASS[tournamentClass as keyof typeof TOURNAMENT_CLASS_BADGE_CLASS]}`}>
                <span className="flex items-center gap-1.5">
                  <IconClass className="h-3 w-3" />
                  {classLabel}
                </span>
              </span>
              <span className={`${BADGE_BASE} bg-slate-100 text-slate-700 border border-slate-200`}>
                {sanitizeLabel(format)}
              </span>
              <span className={`${BADGE_BASE} bg-slate-100 text-slate-700 border border-slate-200`}>
                {type === "FULL" ? "Torneo Inteligente" : "Solo Difusión"}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-sans">
              Gestiona los horarios y canchas destinadas para el torneo.
            </p>
          </div>
          <div className="p-6 space-y-8">
            {/* 1. Seleccionar Canchas */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-sans">
                1. Seleccionar Cancha
              </h2>
              <div className="flex flex-wrap gap-3">
                {courtStates.map((court) => {
                  const isSelected = selectedCourtId === court.id
                  return (
                    <div key={court.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCourtId(court.id)}
                        className={`px-4 py-2 rounded-full border-2 text-sm font-bold flex items-center gap-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                        {court.name || "Cancha"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourt(court.id)}
                        className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50/80 transition-colors"
                        aria-label="Eliminar cancha"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
                <AddCourtButton
                  tournamentId={tournamentId}
                  createCourt={createCourt}
                  courtsQuery={courtsQuery}
                />
              </div>
            </section>

            {/* 2 y 3. Día + Grilla de Horarios */}
            {selectedCourt && (
              <section>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                      2. Horarios de {selectedCourt.name || "Cancha"}
                    </h2>
                    <div className="flex bg-slate-100 rounded-md p-0.5">
                      <button
                        type="button"
                        onClick={() => updateCourtState(selectedCourt.id, (c) => ({ ...c, isIndoor: true }))}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                          selectedCourt.isIndoor ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Interior
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCourtState(selectedCourt.id, (c) => ({ ...c, isIndoor: false }))}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                          !selectedCourt.isIndoor ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Exterior
                      </button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 px-4 py-2 rounded-xl text-sm"
                    onClick={() => handleReplicateToAll(selectedCourt.id)}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copiar horario a todas
                  </Button>
                </div>
                <ScheduleSlotGrid
                  schedule={selectedCourt.schedule}
                  onScheduleChange={(schedule) =>
                    updateCourtState(selectedCourt.id, (c) => ({ ...c, schedule }))
                  }
                  matchDurationMinutes={matchDurationMinutes}
                  tournamentDates={tournamentDates}
                  selectedDate={selectedDate}
                  onSelectedDateChange={setSelectedDate}
                  gridCols="grid-cols-3 sm:grid-cols-2 lg:grid-cols-3"
                  slotMatches={slotMatches}
                />
              </section>
            )}
          </div>
        </div>

        {courtStates.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={handleSaveAllSchedules}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saving ? "Guardando…" : "Guardar horarios"}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile: cabecera + tarjetas colapsables + Drawer */}
      <div className="lg:hidden space-y-4">
        <div className="mb-4">
          <h1 className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 font-display">
            Disponibilidad de Canchas
          </h1>
          <p className="text-slate-500 text-sm font-sans mt-1">
            Gestiona los horarios y canchas destinadas para el torneo.
          </p>
        </div>
        {courtStates.map((court, idx) => (
          <CourtCard
            key={court.id}
            id={court.id}
            name={court.name}
            venue={court.venue}
            isIndoor={court.isIndoor}
            schedule={court.schedule}
            isPrimary={idx === 0}
            onNameChange={(v) => updateCourtState(court.id, (c) => ({ ...c, name: v }))}
            onVenueChange={(v) => updateCourtState(court.id, (c) => ({ ...c, venue: v }))}
            onIndoorChange={(v) => updateCourtState(court.id, (c) => ({ ...c, isIndoor: v }))}
            onScheduleChange={(schedule) =>
              updateCourtState(court.id, (c) => ({ ...c, schedule }))
            }
            onReplicateToAll={() => handleReplicateToAll(court.id)}
            onDelete={() => handleDeleteCourt(court.id)}
            onEditSchedule={() => setMobileDrawerCourtId(court.id)}
          />
        ))}

        <div className="w-full">
          <AddCourtButton
            tournamentId={tournamentId}
            createCourt={createCourt}
            courtsQuery={courtsQuery}
            fullWidth
          />
        </div>

        {courtStates.length > 0 && (
          <Button
            onClick={handleSaveAllSchedules}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? "Guardando…" : "Guardar horarios"}
          </Button>
        )}
      </div>

      {/* Drawer móvil para editar horarios */}
      {mobileDrawerCourtId && (() => {
        const court = courtStates.find((c) => c.id === mobileDrawerCourtId)
        if (!court) return null
        return (
          <ScheduleEditorDrawer
            open={!!mobileDrawerCourtId}
            onOpenChange={(open) => !open && setMobileDrawerCourtId(null)}
            schedule={court.schedule}
            onScheduleChange={(schedule) =>
              updateCourtState(court.id, (c) => ({ ...c, schedule }))
            }
            courtName={court.name || "Cancha"}
            matchDurationMinutes={matchDurationMinutes}
            tournamentDates={tournamentDates}
            startDate={startDate}
            endDate={endDate}
          />
        )
      })()}
    </div>
  )
})

function AddCourtButton({
  tournamentId,
  createCourt,
  courtsQuery,
  fullWidth,
}: {
  tournamentId: string
  createCourt: ReturnType<typeof useCreateTournamentCourt>
  courtsQuery: ReturnType<typeof useTournamentCourts>
  fullWidth?: boolean
}) {
  const { toast } = useToast()

  async function handleAddCourt() {
    try {
      await createCourt.mutateAsync({
        tournamentId,
        data: {
          name: `Cancha ${(courtsQuery.data?.data?.length ?? 0) + 1}`,
          venue: "Pista",
          isIndoor: false,
        },
      })
      courtsQuery.refetch()
      toast({ title: "Cancha añadida" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo añadir la cancha",
        variant: "destructive",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleAddCourt}
      disabled={createCourt.isPending}
      className={`px-3 py-2 rounded-full border-2 border-dashed border-slate-300 text-slate-400 text-sm font-bold hover:text-primary hover:border-primary transition-all flex items-center gap-1 ${
        fullWidth ? "w-full justify-center py-4 rounded-xl" : ""
      }`}
    >
      <PlusCircle className="h-4 w-4" />
      Añadir otra cancha
    </button>
  )
}
