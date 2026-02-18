"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScheduleSlotGrid } from "./ScheduleSlotGrid"
import { countScheduleTurnos } from "./schedule-summary"
import type { DaySchedule } from "@/components/club/weekly-schedule-editor"
import type { TournamentDate } from "./slot-utils"

export interface ScheduleEditorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: DaySchedule[]
  onScheduleChange: (schedule: DaySchedule[]) => void
  courtName: string
  matchDurationMinutes: number
  tournamentDates: TournamentDate[]
  startDate: string
  endDate: string
}

export function ScheduleEditorDrawer({
  open,
  onOpenChange,
  schedule,
  onScheduleChange,
  courtName,
  matchDurationMinutes,
  tournamentDates,
  startDate,
  endDate,
}: ScheduleEditorDrawerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")

  useEffect(() => {
    if (open && tournamentDates.length > 0) {
      setSelectedDate((prev) => {
        const valid = tournamentDates.some((d) => d.date === prev)
        return valid ? prev : tournamentDates[0].date
      })
    }
  }, [open, tournamentDates])

  function handleSave() {
    onOpenChange(false)
  }

  const totalTurnos = countScheduleTurnos(schedule)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[85vh] rounded-t-2xl p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle>Configurar horarios — {courtName}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <ScheduleSlotGrid
            schedule={schedule}
            onScheduleChange={onScheduleChange}
            matchDurationMinutes={matchDurationMinutes}
            tournamentDates={tournamentDates}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            gridCols="grid-cols-3"
            tabsScrollable
          />
        </div>
        <div className="p-4 border-t shrink-0 bg-background flex flex-col gap-3">
          <p className="text-center text-sm text-muted-foreground">
            {totalTurnos} turnos habilitados
          </p>
          <Button className="w-full" onClick={handleSave}>
            Guardar horarios
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
