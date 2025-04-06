
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface AssignmentDatePickerProps {
  startDate?: Date | null
  endDate?: Date | null
  onStartDateChange?: (date: Date | null) => void
  onEndDateChange?: (date: Date | null) => void
  disabled?: boolean
}

export function AssignmentDatePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  disabled = false 
}: AssignmentDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !startDate && !endDate && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate && endDate ? (
            <span>
              {format(startDate, "PPP")} - {format(endDate, "PPP")}
            </span>
          ) : startDate ? (
            <span>From {format(startDate, "PPP")}</span>
          ) : endDate ? (
            <span>Until {format(endDate, "PPP")}</span>
          ) : (
            <span>Select date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={startDate || undefined}
          onSelect={onStartDateChange}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
