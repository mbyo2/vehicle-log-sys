import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from '@/hooks/useDashboardMetrics';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

export const rangePresets: { label: string; build: () => DateRange }[] = [
  {
    label: 'This month',
    build: () => {
      const n = new Date();
      return { from: new Date(n.getFullYear(), n.getMonth(), 1), to: endOfDay(n) };
    },
  },
  {
    label: 'Last month',
    build: () => {
      const n = new Date();
      return {
        from: new Date(n.getFullYear(), n.getMonth() - 1, 1),
        to: new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59),
      };
    },
  },
  {
    label: 'Last 30 days',
    build: () => {
      const n = new Date();
      const from = new Date(n);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(n) };
    },
  },
  {
    label: 'Last 6 months',
    build: () => {
      const n = new Date();
      return { from: new Date(n.getFullYear(), n.getMonth() - 5, 1), to: endOfDay(n) };
    },
  },
  {
    label: 'Year to date',
    build: () => {
      const n = new Date();
      return { from: new Date(n.getFullYear(), 0, 1), to: endOfDay(n) };
    },
  },
];

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {rangePresets.map((p) => {
          const r = p.build();
          const active =
            format(r.from, 'yyyy-MM-dd') === format(value.from, 'yyyy-MM-dd') &&
            format(r.to, 'yyyy-MM-dd') === format(value.to, 'yyyy-MM-dd');
          return (
            <Button
              key={p.label}
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => onChange(p.build())}
            >
              {p.label}
            </Button>
          );
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn('justify-start text-left font-normal')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(value.from, 'd MMM yyyy')} – {format(value.to, 'd MMM yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={value.from}
            selected={{ from: value.from, to: value.to }}
            onSelect={(r: any) => {
              if (r?.from && r?.to) {
                onChange({ from: startOfDay(r.from), to: endOfDay(r.to) });
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
