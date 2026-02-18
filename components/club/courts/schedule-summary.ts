import type { DaySchedule } from "@/components/club/weekly-schedule-editor"

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
}

function formatTime24to12(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const hour = h ?? 0
  const ampm = hour >= 12 ? "pm" : "am"
  const hour12 = hour % 12 || 12
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${ampm}`
}

/**
 * Cuenta el total de turnos (bloques de 1h) habilitados en el horario
 */
export function countScheduleTurnos(schedule: DaySchedule[]): number {
  let total = 0
  for (const d of schedule) {
    if (d.closed || !d.slots?.length) continue
    for (const s of d.slots) {
      const [sh, sm] = (s.start || "07:00").split(":").map(Number)
      const [eh, em] = (s.end || "08:00").split(":").map(Number)
      const mins = (eh ?? 8) * 60 + (em ?? 0) - ((sh ?? 7) * 60 + (sm ?? 0))
      total += Math.max(0, Math.round(mins / 60))
    }
  }
  return total
}

/**
 * Genera un resumen legible del horario.
 * En móvil: "X turnos habilitados"
 * En desktop: "Lunes a Viernes: 07:00 am - 10:00 pm"
 */
export function formatScheduleSummary(schedule: DaySchedule[]): string {
  const enabled = schedule.filter((d) => !d.closed && d.slots?.length > 0)
  if (enabled.length === 0) return "Sin horarios configurados"

  const order: string[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]
  const enabledDays = enabled
    .map((d) => d.day)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))

  const allSlots = enabled.flatMap((d) =>
    (d.slots ?? []).map((s) => ({ start: s.start, end: s.end }))
  )
  const uniqueSlots = allSlots.filter(
    (s, i, arr) =>
      arr.findIndex((x) => x.start === s.start && x.end === s.end) === i
  )
  const timeRange =
    uniqueSlots.length === 1
      ? `${formatTime24to12(uniqueSlots[0].start)} - ${formatTime24to12(uniqueSlots[0].end)}`
      : uniqueSlots.length > 1
        ? `${uniqueSlots.length} turnos`
        : "—"

  if (enabledDays.length === 7) {
    return `Todos los días: ${timeRange}`
  }
  if (enabledDays.length === 0) return "Sin horarios"

  const consecutive = (days: string[]): string | null => {
    if (days.length <= 1) return null
    const idx = order.indexOf(days[0])
    for (let i = 0; i < days.length; i++) {
      if (order.indexOf(days[i]) !== idx + i) return null
    }
    return `${DAY_LABELS[days[0]]} a ${DAY_LABELS[days[days.length - 1]]}`
  }

  const range = consecutive(enabledDays)
  if (range) {
    return `${range}: ${timeRange}`
  }

  const dayNames = enabledDays.map((d) => DAY_LABELS[d] ?? d).join(", ")
  return `${dayNames}: ${timeRange}`
}

/**
 * Resumen corto para móvil: "X turnos habilitados"
 */
export function formatScheduleSummaryShort(schedule: DaySchedule[]): string {
  const total = countScheduleTurnos(schedule)
  if (total === 0) return "Sin horarios configurados"
  return `${total} turnos habilitados`
}
