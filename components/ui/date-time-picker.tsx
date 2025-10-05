// components/ui/date-time-picker.tsx
"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  minDate,
  maxDate,
  disabled = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [isOpen, setIsOpen] = React.useState(false)

  // Sync external value changes
  React.useEffect(() => {
    setSelectedDate(value)
  }, [value])

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  // Generate minutes in 15-minute intervals
  const minutes = [0, 15, 30, 45]

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      onChange?.(undefined)
      return
    }

    // If there's already a selected date with time, preserve the time
    if (selectedDate) {
      const newDate = new Date(date)
      newDate.setHours(selectedDate.getHours())
      newDate.setMinutes(selectedDate.getMinutes())
      setSelectedDate(newDate)
      onChange?.(newDate)
    } else {
      // Default to current time
      const now = new Date()
      date.setHours(now.getHours())
      date.setMinutes(now.getMinutes())
      setSelectedDate(date)
      onChange?.(date)
    }
  }

  // Normalize dates to start of day for comparison
  const normalizeDateForComparison = (date: Date) => {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  const handleTimeChange = (type: "hour" | "minute", value: string): void => {
    if (!selectedDate) {
      // If no date selected, use today
      const newDate = new Date()
      if (type === "hour") {
        newDate.setHours(parseInt(value, 10))
      } else {
        newDate.setMinutes(parseInt(value, 10))
      }
      setSelectedDate(newDate)
      onChange?.(newDate)
      return
    }

    const newDate = new Date(selectedDate)
    if (type === "hour") {
      newDate.setHours(parseInt(value, 10))
    } else {
      newDate.setMinutes(parseInt(value, 10))
    }
    setSelectedDate(newDate)
    onChange?.(newDate)
  }

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return placeholder

    return format(date, "PPP 'at' h:mm a")
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700",
            !selectedDate && "text-neutral-400"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateDisplay(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-neutral-900 border-neutral-700" 
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col bg-neutral-900">
          {/* Calendar with explicit dark theme */}
          <div className="p-3 bg-neutral-900">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                // Normalize dates to compare only the date part, not time
                const normalizedDate = normalizeDateForComparison(date)
                if (minDate) {
                  const normalizedMin = normalizeDateForComparison(minDate)
                  if (normalizedDate < normalizedMin) return true
                }
                if (maxDate) {
                  const normalizedMax = normalizeDateForComparison(maxDate)
                  if (normalizedDate > normalizedMax) return true
                }
                return false
              }}
              initialFocus
              className="bg-neutral-900 text-white"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center text-white",
                caption_label: "text-sm font-medium text-white",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 text-neutral-400 hover:text-white hover:bg-neutral-800"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-neutral-400 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-neutral-800/50 [&:has([aria-selected])]:bg-neutral-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "h-9 w-9 p-0 font-normal text-white aria-selected:opacity-100 hover:bg-neutral-700 hover:text-white rounded-md transition-colors"
                ),
                day_range_end: "day-range-end",
                day_selected: "bg-[#C9A961] text-black hover:bg-[#C9A961] hover:text-black focus:bg-[#C9A961] focus:text-black font-semibold",
                day_today: "!bg-transparent text-black font-semibold ring-2 ring-[#C9A961] hover:bg-neutral-700 hover:text-white !shadow-none",
                day_outside: "day-outside text-neutral-600 opacity-50 aria-selected:bg-neutral-800/50 aria-selected:text-neutral-500 aria-selected:opacity-30",
                day_disabled: "text-neutral-600 opacity-50",
                day_range_middle: "aria-selected:bg-neutral-800 aria-selected:text-white",
                day_hidden: "invisible",
              }}
            />
          </div>
          
          {/* Time Picker */}
          <div className="border-t border-neutral-700 p-3 bg-neutral-800/50">
            <div className="flex items-center gap-1">
              <div className="flex-1">
                <label className="text-xs text-neutral-400 mb-1 block">Hour</label>
                <Select
                  value={selectedDate?.getHours().toString() || "12"}
                  onValueChange={(value: string) => handleTimeChange("hour", value)}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700 max-h-[200px]">
                    {hours.map((hour) => (
                      <SelectItem 
                        key={hour} 
                        value={hour.toString()}
                        className="text-white hover:bg-neutral-800"
                      >
                        {hour.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-xs text-neutral-400 mb-1 block">Minute</label>
                <Select
                  value={selectedDate?.getMinutes().toString() || "0"}
                  onValueChange={(value: string) => handleTimeChange("minute", value)}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    {minutes.map((minute) => (
                      <SelectItem 
                        key={minute} 
                        value={minute.toString()}
                        className="text-white hover:bg-neutral-800"
                      >
                        {minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedDate && (
              <div className="mt-3 pt-3 border-t border-neutral-700">
                <p className="text-xs text-neutral-400">Selected:</p>
                <p className="text-sm text-white font-medium">
                  {format(selectedDate, "PPP 'at' h:mm a")}
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}