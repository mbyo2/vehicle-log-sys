import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DriverSelectorProps {
  selectedDriverId: string | null;
  onDriverSelect: (driverId: string) => void;
}

interface SupabaseDriverResponse {
  id: string;
  profile: {
    full_name: string;
  };
}

export function DriverSelector({ selectedDriverId, onDriverSelect }: DriverSelectorProps) {
  const { data: drivers, isLoading } = useQuery({
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
    }
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Select value={selectedDriverId || undefined} onValueChange={onDriverSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select a driver" />
      </SelectTrigger>
      <SelectContent>
        {drivers?.map((driver) => (
          <SelectItem key={driver.id} value={driver.id}>
            {driver.profile.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}