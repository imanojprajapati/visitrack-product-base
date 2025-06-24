"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface TimePickerProps {
  value?: string
  onChange?: (event: { target: { name: string; value: string } }) => void
  name?: string
  id?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  ({ value, onChange, name, id, placeholder = "Select time", disabled, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)

    // Generate time options (every 15 minutes)
    const generateTimeOptions = () => {
      const times = []
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const displayTime = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
          times.push({ value: timeValue, display: displayTime })
        }
      }
      return times
    }

    const timeOptions = generateTimeOptions()

    const handleSelect = (timeValue: string) => {
      if (onChange && name) {
        onChange({
          target: {
            name: name,
            value: timeValue
          }
        })
      }
      setOpen(false)
    }

    // Format display time
    const formatDisplayTime = (time: string) => {
      if (!time) return placeholder
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal bg-[#F9F7F7] border-[#DBE2EF] hover:bg-[#DBE2EF] hover:border-[#3F72AF] text-[#112D4E]",
              !value && "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
            disabled={disabled}
            type="button"
          >
            <Clock className="mr-2 h-4 w-4" />
            {value ? formatDisplayTime(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-[#DBE2EF]" align="start">
          <div className="max-h-60 overflow-y-auto p-2">
            <div className="grid gap-1">
              {timeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal hover:bg-[#DBE2EF] text-[#112D4E]",
                    value === option.value && "bg-[#3F72AF] text-white hover:bg-[#112D4E] hover:text-white"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.display}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
TimePicker.displayName = "TimePicker"

export { TimePicker } 