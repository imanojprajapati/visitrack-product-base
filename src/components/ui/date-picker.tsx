"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DatePickerProps {
  value?: string
  onChange?: (event: { target: { name: string; value: string } }) => void
  name?: string
  id?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  min?: string
  max?: string
  className?: string
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, name, id, placeholder = "Pick a date", disabled, className, min, max, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    
    // Convert string value to Date object
    const dateValue = value ? new Date(value) : undefined
    
    // Convert min/max strings to Date objects
    const minDate = min ? new Date(min) : undefined
    const maxDate = max ? new Date(max) : undefined

    const handleSelect = (selectedDate: Date | undefined) => {
      if (selectedDate && onChange && name) {
        // Format date as YYYY-MM-DD for form compatibility
        const formattedDate = format(selectedDate, "yyyy-MM-dd")
        onChange({
          target: {
            name: name,
            value: formattedDate
          }
        })
      }
      setOpen(false)
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal bg-[#F9F7F7] border-[#DBE2EF] hover:bg-[#DBE2EF] hover:border-[#3F72AF] text-[#112D4E]",
              !dateValue && "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? (
              format(dateValue, "PPP")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-[#DBE2EF]" align="start">
          <DayPicker
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            disabled={(date) => {
              // Allow same date for min/max (single day events)
              // Only disable if date is strictly less than min or strictly greater than max
              if (minDate) {
                const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                if (dateOnly < minDateOnly) return true;
              }
              if (maxDate) {
                const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
                if (dateOnly > maxDateOnly) return true;
              }
              return false
            }}
            initialFocus
            className="p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-[#112D4E]",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F72AF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-[#112D4E] hover:bg-[#DBE2EF]"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-[#3F72AF]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-middle)]:rounded-none [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F72AF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-[#112D4E] hover:bg-[#DBE2EF]"
              ),
              day_range_end: "day-range-end",
              day_selected: "bg-[#3F72AF] text-white hover:bg-[#112D4E] hover:text-white focus:bg-[#3F72AF] focus:text-white",
              day_today: "bg-[#DBE2EF] text-[#112D4E]",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker } 