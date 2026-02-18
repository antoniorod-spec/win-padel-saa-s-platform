import type { DaySchedule, ScheduleDay } from "@/components/club/weekly-schedule-editor"

const DAY_NAMES_ES: Record<ScheduleDay, string> = {
  MONDAY: "LUNES",
  TUESDAY: "MARTES",
  WEDNESDAY: "MIÉRCOLES",
  THURSDAY: "JUEVES",
  FRIDAY: "VIERNES",
  SATURDAY: "SÁBADO",
  SUNDAY: "DOMINGO",
}

const DAY_NAMES_SHORT: Record<ScheduleDay, string> = {
  MONDAY: "LUN",
  TUESDAY: "MAR",
  WEDNESDAY: "MIÉ",
  THURSDAY: "JUE",
  FRIDAY: "VIE",
  SATURDAY: "SAB",
  SUNDAY: "DOM",
}

export interface TournamentDate {
  date: string
  label: string
  dayShort: string
  dayNum: number
  scheduleDay: ScheduleDay
}

/** Parsea YYYY-MM-DD en hora local (evita desfases por UTC) */
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Genera fechas dinámicas del torneo (startDate a endDate) - inclusive */
export function getTournamentDates(
  startDate: string,
  endDate: string
): TournamentDate[] {
  if (!startDate || !endDate) return []
  const start = parseDateLocal(startDate)
  const end = parseDateLocal(endDate)
  if (start > end) return []

  const DOW_TO_DAY: Record<number, ScheduleDay> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  }

  const result: TournamentDate[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate())

  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, "0")
    const d = String(current.getDate()).padStart(2, "0")
    const dateStr = `${y}-${m}-${d}`
    const dow = current.getDay()
    const scheduleDay = DOW_TO_DAY[dow] ?? "MONDAY"
    const dayNum = current.getDate()
    const label = `${DAY_NAMES_ES[scheduleDay]} ${dayNum}`
    const dayShort = DAY_NAMES_SHORT[scheduleDay]
    result.push({ date: dateStr, label, dayShort, dayNum, scheduleDay })
    current.setDate(current.getDate() + 1)
  }
  return result
}

export interface TimeSlot {
  index: number
  start: string
  end: string
}

/** Convierte minutos desde medianoche a "HH:MM" */
function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Genera slots dinámicos según duración del partido.
 * Inicio: horaApertura. Siguiente: anterior + matchDuration. Parada: cuando supera horaCierre.
 * Ej: 70 min → ['08:00', '09:10', '10:20', '11:30'...]
 */
export function generateTimeSlots(
  matchDurationMinutes: number,
  openHour = 8,
  closeHour = 23
): TimeSlot[] {
  const duration = Math.max(15, matchDurationMinutes)
  const openMins = openHour * 60
  const closeMins = closeHour * 60

  const result: TimeSlot[] = []
  let startMins = openMins
  let index = 0

  while (startMins + duration <= closeMins) {
    const endMins = startMins + duration
    result.push({
      index,
      start: minsToTime(startMins),
      end: minsToTime(endMins),
    })
    startMins = endMins
    index++
  }

  return result
}

/** @deprecated Usar generateTimeSlots. Mantenido por compatibilidad. */
export const TIME_BLOCKS = generateTimeSlots(60)

/** Obtiene los índices de slots seleccionados para un solo día */
export function getSelectedBlocksForDay(
  schedule: DaySchedule[],
  scheduleDay: ScheduleDay,
  matchDurationMinutes: number
): Set<number> {
  const dayEntry = schedule.find((d) => d.day === scheduleDay)
  if (!dayEntry || dayEntry.closed || !dayEntry.slots?.length) return new Set()

  const slots = generateTimeSlots(matchDurationMinutes)
  const startToIndex = new Map(slots.map((s, i) => [s.start, i]))

  const selected = new Set<number>()
  for (const slot of dayEntry.slots) {
    const idx = startToIndex.get(slot.start)
    if (idx !== undefined) selected.add(idx)
  }
  return selected
}

/** Actualiza el schedule para un solo día con los slots seleccionados (por índice) */
export function updateScheduleForDay(
  schedule: DaySchedule[],
  scheduleDay: ScheduleDay,
  selectedIndices: Set<number>,
  matchDurationMinutes: number
): DaySchedule[] {
  const slots = generateTimeSlots(matchDurationMinutes)
  const daySlots = [...selectedIndices]
    .sort((a, b) => a - b)
    .filter((i) => i >= 0 && i < slots.length)
    .map((i) => ({ start: slots[i].start, end: slots[i].end }))

  return schedule.map((d) =>
    d.day === scheduleDay
      ? { ...d, closed: daySlots.length === 0, slots: daySlots }
      : d
  )
}

/** Replica el horario del día seleccionado a todos los días restantes del torneo */
export function replicateScheduleToRemainingDays(
  schedule: DaySchedule[],
  selectedDate: string,
  tournamentDates: TournamentDate[],
  matchDurationMinutes: number
): DaySchedule[] {
  const selected = tournamentDates.find((d) => d.date === selectedDate)
  if (!selected) return schedule

  const sourceBlocks = getSelectedBlocksForDay(
    schedule,
    selected.scheduleDay,
    matchDurationMinutes
  )
  const selectedIdx = tournamentDates.findIndex((d) => d.date === selectedDate)
  if (selectedIdx < 0) return schedule

  let result = [...schedule]
  for (let i = selectedIdx + 1; i < tournamentDates.length; i++) {
    const targetDay = tournamentDates[i].scheduleDay
    result = updateScheduleForDay(
      result,
      targetDay,
      new Set(sourceBlocks),
      matchDurationMinutes
    )
  }
  return result
}

/** Replica el horario al mismo día de la próxima semana (ej. Viernes a Viernes) */
export function replicateScheduleToSameDayNextWeek(
  schedule: DaySchedule[],
  selectedDate: string,
  tournamentDates: TournamentDate[],
  matchDurationMinutes: number
): DaySchedule[] {
  const selected = tournamentDates.find((d) => d.date === selectedDate)
  if (!selected) return schedule

  const sourceBlocks = getSelectedBlocksForDay(
    schedule,
    selected.scheduleDay,
    matchDurationMinutes
  )
  const selectedIdx = tournamentDates.findIndex((d) => d.date === selectedDate)
  if (selectedIdx < 0) return schedule

  const targetIdx = tournamentDates.findIndex(
    (d, i) => i > selectedIdx && d.scheduleDay === selected.scheduleDay
  )
  if (targetIdx < 0) return schedule

  const targetDay = tournamentDates[targetIdx].scheduleDay
  return updateScheduleForDay(
    schedule,
    targetDay,
    new Set(sourceBlocks),
    matchDurationMinutes
  )
}
