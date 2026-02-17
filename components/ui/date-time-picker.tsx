"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha y hora",
  disabled = false,
  className,
  id,
}: DateTimePickerProps) {
  const date = value ? new Date(value) : undefined
  const timeStr = date ? format(date, "HH:mm") : "09:00"
  const [open, setOpen] = React.useState(false)
  const [time, setTime] = React.useState(timeStr)

  React.useEffect(() => {
    if (date) setTime(format(date, "HH:mm"))
    else setTime("09:00")
  }, [value])

  const toLocalDatetime = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const h = String(d.getHours()).padStart(2, "0")
    const min = String(d.getMinutes()).padStart(2, "0")
    return `${y}-${m}-${day}T${h}:${min}`
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value
    setTime(t)
    const base = date ? new Date(date) : new Date()
    const [h, m] = t.split(":").map(Number)
    base.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0)
    onChange(toLocalDatetime(base))
  }

  const handleCalendarSelect = (d: Date | undefined) => {
    if (!d) return
    const [h, m] = time.split(":").map(Number)
    const combined = new Date(d)
    combined.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0)
    onChange(toLocalDatetime(combined))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start text-left font-normal rounded-xl border border-input bg-background hover:bg-accent/50",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground shrink-0" />
          {date ? (
            <>
              {format(date, "d MMM yyyy", { locale: es })} · {format(date, "HH:mm")}
            </>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl border" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleCalendarSelect}
          disabled={disabled}
          initialFocus
          className="rounded-xl"
        />
        <div className="flex items-center gap-2 p-3 border-t">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={time}
            onChange={handleTimeChange}
            className="h-9 rounded-lg"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
