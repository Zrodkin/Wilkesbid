// components/ui/date-time-picker.tsx
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  minDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [hour, setHour] = React.useState(value ? value.getHours() % 12 || 12 : 12)
  const [minute, setMinute] = React.useState(value ? value.getMinutes() : 0)
  const [period, setPeriod] = React.useState<'AM' | 'PM'>(
    value && value.getHours() >= 12 ? 'PM' : 'AM'
  )

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setHour(value.getHours() % 12 || 12)
      setMinute(value.getMinutes())
      setPeriod(value.getHours() >= 12 ? 'PM' : 'AM')
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      updateDateTime(date, hour, minute, period)
    }
  }

  const handleTimeChange = (newHour: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
    setHour(newHour)
    setMinute(newMinute)
    setPeriod(newPeriod)
    if (selectedDate) {
      updateDateTime(selectedDate, newHour, newMinute, newPeriod)
    }
  }

  const updateDateTime = (date: Date, h: number, m: number, p: 'AM' | 'PM') => {
    const newDate = new Date(date)
    let hours24 = h
    if (p === 'PM' && h !== 12) hours24 = h + 12
    if (p === 'AM' && h === 12) hours24 = 0
    newDate.setHours(hours24, m, 0, 0)
    onChange(newDate)
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-left focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 hover:bg-neutral-750 transition-colors flex items-center justify-between",
            !value && "text-neutral-400",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-neutral-400" />
            {value ? (
              format(value, "PPp")
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
        <div className="flex flex-col">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => minDate ? date < minDate : false}
            initialFocus
          />
          
          {/* Time Picker */}
          <div className="border-t border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-[#C9A961]" />
              <span className="text-sm font-medium text-neutral-300">Select Time</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Hour Selector */}
              <select
                value={hour}
                onChange={(e) => handleTimeChange(Number(e.target.value), minute, period)}
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 text-center font-mono text-lg"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>

              <span className="text-neutral-400 font-bold text-lg">:</span>

              {/* Minute Selector */}
              <select
                value={minute}
                onChange={(e) => handleTimeChange(hour, Number(e.target.value), period)}
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 text-center font-mono text-lg"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>

              {/* AM/PM Selector */}
              <select
                value={period}
                onChange={(e) => handleTimeChange(hour, minute, e.target.value as 'AM' | 'PM')}
                className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 text-center font-mono text-lg"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            {/* Current Time Display */}
            {selectedDate && (
              <div className="mt-3 text-center text-sm text-neutral-400">
                Selected: {format(selectedDate, "PPp")}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}