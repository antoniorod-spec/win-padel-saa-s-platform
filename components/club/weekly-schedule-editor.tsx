"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ScheduleDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"

export interface ScheduleSlot {
  start: string
  end: string
}

export interface DaySchedule {
  day: ScheduleDay
  closed: boolean
  slots: ScheduleSlot[]
}

const DAYS: Array<{ key: ScheduleDay; label: string }> = [
  { key: "MONDAY", label: "Lunes" },
  { key: "TUESDAY", label: "Martes" },
  { key: "WEDNESDAY", label: "Miercoles" },
  { key: "THURSDAY", label: "Jueves" },
  { key: "FRIDAY", label: "Viernes" },
  { key: "SATURDAY", label: "Sabado" },
  { key: "SUNDAY", label: "Domingo" },
]

export function defaultWeeklySchedule(): DaySchedule[] {
  return DAYS.map((day) => ({
    day: day.key,
    closed: false,
    slots: [{ start: "07:00", end: "22:00" }],
  }))
}

interface WeeklyScheduleEditorProps {
  value: DaySchedule[]
  onChange: (schedule: DaySchedule[]) => void
}

export function WeeklyScheduleEditor({ value, onChange }: WeeklyScheduleEditorProps) {
  function updateDay(day: ScheduleDay, updater: (current: DaySchedule) => DaySchedule) {
    const next = value.map((item) => (item.day === day ? updater(item) : item))
    onChange(next)
  }

  function addSlot(day: ScheduleDay) {
    updateDay(day, (current) => ({
      ...current,
      closed: false,
      slots: [...current.slots, { start: "07:00", end: "22:00" }],
    }))
  }

  function removeSlot(day: ScheduleDay, idx: number) {
    updateDay(day, (current) => ({
      ...current,
      slots: current.slots.filter((_, slotIdx) => slotIdx !== idx),
    }))
  }

  return (
    <div className="space-y-4">
      {DAYS.map((day) => {
        const current = value.find((item) => item.day === day.key) ?? {
          day: day.key,
          closed: false,
          slots: [{ start: "07:00", end: "22:00" }],
        }
        return (
          <div key={day.key} className="rounded-lg border border-border/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <Label className="font-medium">{day.label}</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={current.closed}
                  onCheckedChange={(checked) =>
                    updateDay(day.key, (item) => ({
                      ...item,
                      closed: Boolean(checked),
                      slots: Boolean(checked) ? [] : item.slots.length > 0 ? item.slots : [{ start: "07:00", end: "22:00" }],
                    }))
                  }
                />
                Cerrado
              </label>
            </div>
            {!current.closed ? (
              <div className="space-y-2">
                {current.slots.map((slot, idx) => (
                  <div key={`${day.key}-${idx}`} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        updateDay(day.key, (item) => ({
                          ...item,
                          slots: item.slots.map((s, i) => (i === idx ? { ...s, start: e.target.value } : s)),
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">a</span>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) =>
                        updateDay(day.key, (item) => ({
                          ...item,
                          slots: item.slots.map((s, i) => (i === idx ? { ...s, end: e.target.value } : s)),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSlot(day.key, idx)}
                      disabled={current.slots.length <= 1}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addSlot(day.key)}>
                  Agregar bloque
                </Button>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
