import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Driver {
  id: string;
  profile_id: string;
  man_number: string;
  license_number: string | null;
  license_expiry: string | null;
  profile: {
    full_name: string;
    email: string;
  };
}

interface DriverFormData {
  profile_id: string;
  man_number: string;
  license_number?: string;
  license_expiry?: string;
}

export function useDrivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: drivers, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles(full_name, email)
        `);

      if (error) throw error;
      return data as Driver[];
    },
  });

  const { data: availableProfiles } = useQuery({
    queryKey: ['available-profiles'],
    queryFn: async () => {
      const { data: existingDrivers } = await supabase
        .from('drivers')
        .select('profile_id');

      const existingProfileIds = existingDrivers?.map(d => d.profile_id) || [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'driver')
        .not('id', 'in', `(${existingProfileIds.join(',')})`);

      if (error) throw error;
      return data;
    },
  });

  const addDriver = useMutation({
    mutationFn: async (driverData: DriverFormData) => {
      const { error } = await supabase
        .from('drivers')
        .insert(driverData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: "Success",
        description: "Driver added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateDriver = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DriverFormData> }) => {
      const { error } = await supabase
        .from('drivers')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: "Success",
        description: "Driver updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    drivers,
    availableProfiles,
    isLoading: isLoading || isLoadingDrivers,
    addDriver: addDriver.mutate,
    updateDriver: updateDriver.mutate,
  };
}