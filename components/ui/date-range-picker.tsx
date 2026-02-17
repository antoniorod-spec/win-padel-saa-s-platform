"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRangeValue {
  from: string
  to: string
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
}

const rangeClassNames = {
  day_range_start:
    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
  day_range_end:
    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
  day_range_middle:
    "bg-primary/15 text-foreground hover:bg-primary/20 rounded-none",
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar periodo",
  disabled = false,
  required = false,
  className,
  id,
}: DateRangePickerProps) {
  const from = value.from ? new Date(value.from + "T12:00:00") : undefined
  const to = value.to ? new Date(value.to + "T12:00:00") : undefined
  const range: DateRange | undefined =
    from && to ? { from, to } : from ? { from, to: from } : undefined
  const hasRange = Boolean(value.from && value.to)
  const [open, setOpen] = React.useState(false)

  const handleSelect = (r: DateRange | undefined) => {
    if (!r?.from) return
    const fromStr = format(r.from, "yyyy-MM-dd")
    const toStr = r.to ? format(r.to, "yyyy-MM-dd") : fromStr
    onChange({ from: fromStr, to: toStr })
    if (r.from && r.to) setOpen(false)
  }

  const displayText =
    hasRange && from && to
      ? `${format(from, "d MMM", { locale: es })} - ${format(to, "d MMM", { locale: es })}`
      : from
        ? format(from, "d MMM yyyy", { locale: es })
        : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start text-left font-normal rounded-xl border border-input bg-background hover:bg-accent/50",
            !range && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground shrink-0" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl border" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          disabled={disabled}
          initialFocus
          numberOfMonths={1}
          classNames={rangeClassNames}
          className="rounded-xl"
        />
      </PopoverContent>
    </Popover>
  )
}
