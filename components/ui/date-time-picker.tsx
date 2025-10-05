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
      <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
        <div className="flex flex-col">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            initialFocus
          />
          
          {/* Time Picker */}
          <div className="border-t border-neutral-700 p-3 bg-neutral-800/50">
            <div className="flex items-center gap-2">
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