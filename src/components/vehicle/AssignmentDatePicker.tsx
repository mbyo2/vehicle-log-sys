
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
  // Add compatibility props for DatePicker interface
  date?: Date | null
  onDateChange?: (date: Date | null) => void
}

export function AssignmentDatePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  date, // Support DatePicker interface
  onDateChange, // Support DatePicker interface
  disabled = false 
}: AssignmentDatePickerProps) {
  // If date and onDateChange are provided, use them for startDate and onStartDateChange
  const effectiveStartDate = date || startDate;
  const effectiveOnStartDateChange = onDateChange || onStartDateChange;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !effectiveStartDate && !endDate && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {effectiveStartDate && endDate ? (
            <span>
              {format(effectiveStartDate, "PPP")} - {format(endDate, "PPP")}
            </span>
          ) : effectiveStartDate ? (
            <span>From {format(effectiveStartDate, "PPP")}</span>
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
          selected={effectiveStartDate || undefined}
          onSelect={effectiveOnStartDateChange}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
