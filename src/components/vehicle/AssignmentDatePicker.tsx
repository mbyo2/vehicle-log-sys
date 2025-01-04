import { DatePicker } from "@/components/ui/date-picker";

interface AssignmentDatePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export function AssignmentDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: AssignmentDatePickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Start Date</label>
        <DatePicker
          date={startDate}
          onDateChange={onStartDateChange}
        />
      </div>
      <div>
        <label className="text-sm font-medium">End Date</label>
        <DatePicker
          date={endDate}
          onDateChange={onEndDateChange}
        />
      </div>
    </div>
  );
}