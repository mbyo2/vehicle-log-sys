import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface Driver {
  id: string;
  profile: {
    full_name: string;
  };
}

interface SupabaseDriverResponse {
  id: string;
  profile: {
    full_name: string;
  };
}

export const VehicleAssignment = ({ vehicleId }: { vehicleId: string }) => {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          profile:profiles!inner(full_name)
        `);
      
      if (error) throw error;
      
      return (data as unknown as SupabaseDriverResponse[]).map(driver => ({
        id: driver.id,
        profile: {
          full_name: driver.profile.full_name
        }
      }));
    },
  });

  const handleAssign = async () => {
    if (!selectedDriver || !startDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a driver and start date",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: selectedDriver,
          assignment_start_date: startDate.toISOString(),
          assignment_end_date: endDate?.toISOString() || null,
        })
        .eq('id', vehicleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle assigned successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Driver</label>
        <Select onValueChange={setSelectedDriver} value={selectedDriver}>
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers?.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.profile.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date (Optional)</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button onClick={handleAssign} className="w-full">
        Assign Vehicle
      </Button>
    </div>
  );
};