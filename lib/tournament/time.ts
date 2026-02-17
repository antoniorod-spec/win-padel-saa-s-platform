export function parseTimeToMinutes(value: string): number {
  // Accept "HH:MM" (24h). Keep strict to avoid silent scheduling bugs.
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) throw new Error(`Hora invalida: "${value}" (esperado HH:MM)`)
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    throw new Error(`Hora invalida: "${value}" (rango 00:00-23:59)`)
  }
  return hh * 60 + mm
}

export function minutesToTime(value: number): string {
  const mins = Math.max(0, Math.floor(value))
  const hh = Math.floor(mins / 60) % 24
  const mm = mins % 60
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

export function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function combineDateAndTime(date: Date, timeHHmm: string): Date {
  const mins = parseTimeToMinutes(timeHHmm)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(mins / 60), mins % 60, 0, 0)
}

export function slotsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function slotsAdjacent(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  // Consider adjacent if one ends exactly when the other starts.
  return aEnd.getTime() === bStart.getTime() || bEnd.getTime() === aStart.getTime()
}

