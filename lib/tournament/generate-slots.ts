import { prisma } from "@/lib/prisma"
import { combineDateAndTime, dateOnly, minutesToTime, parseTimeToMinutes, sameDay } from "./time"

type SlotCounts = {
  total: number
  byCourt: Record<string, number>
  byDate: Record<string, number>
}

function isoDateKey(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10)
}

export async function generateSlots(tournamentId: string): Promise<SlotCounts> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      courts: {
        include: { availabilities: true },
      },
    },
  })

  if (!tournament) throw new Error("Torneo no encontrado")
  if (tournament.courts.length === 0) throw new Error("Configura al menos 1 cancha para generar slots")

  const duration = tournament.matchDurationMinutes
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Duracion de partido invalida")

  // Only clear re-generatable slots. Keep ASSIGNED/RESERVED/BLOCKED untouched.
  await prisma.matchSlot.deleteMany({
    where: {
      status: "AVAILABLE",
      court: { tournamentId },
    },
  })

  const start = dateOnly(tournament.startDate)
  const end = dateOnly(tournament.endDate)
  if (end < start) throw new Error("Rango de fechas invalido (endDate < startDate)")

  const counts: SlotCounts = { total: 0, byCourt: {}, byDate: {} }

  const createRows: Array<{
    courtId: string
    date: Date
    startTime: string
    endTime: string
    status: "AVAILABLE"
  }> = []

  // Iterate days inclusive.
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d)
    const dow = day.getDay() // 0=Sun
    const dayKey = isoDateKey(day)

    for (const court of tournament.courts) {
      const windows = court.availabilities.filter((a) => {
        if (a.specificDate) return sameDay(a.specificDate, day)
        return a.dayOfWeek === dow
      })

      for (const w of windows) {
        const startMin = parseTimeToMinutes(w.startTime)
        const endMin = parseTimeToMinutes(w.endTime)
        if (endMin <= startMin) continue

        for (let cursor = startMin; cursor + duration <= endMin; cursor += duration) {
          const slotStart = cursor
          const slotEnd = cursor + duration
          const startTime = minutesToTime(slotStart)
          const endTime = minutesToTime(slotEnd)

          // Store date as "date only" and time separately.
          createRows.push({
            courtId: court.id,
            date: dateOnly(day),
            startTime,
            endTime,
            status: "AVAILABLE",
          })

          counts.total += 1
          counts.byCourt[court.id] = (counts.byCourt[court.id] ?? 0) + 1
          counts.byDate[dayKey] = (counts.byDate[dayKey] ?? 0) + 1
        }
      }
    }
  }

  // Chunk insert to avoid huge single queries.
  const CHUNK = 1000
  for (let i = 0; i < createRows.length; i += CHUNK) {
    const part = createRows.slice(i, i + CHUNK)
    await prisma.matchSlot.createMany({ data: part, skipDuplicates: true })
  }

  // Sanity: ensure "startTime/endTime" parse to consistent DateTimes.
  // This is a no-op but validates we didn't produce invalid "HH:MM".
  for (const row of createRows.slice(0, 5)) {
    combineDateAndTime(row.date, row.startTime)
    combineDateAndTime(row.date, row.endTime)
  }

  return counts
}

