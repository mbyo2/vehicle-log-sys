import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Advertisement } from "@/types/advertisement";
import { toast } from "@/hooks/use-toast";

export function useAdvertisements() {
  const queryClient = useQueryClient();

  const { data: advertisements, isLoading } = useQuery({
    queryKey: ["advertisements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Advertisement[];
    },
  });

  const createAdvertisement = useMutation({
    mutationFn: async (newAd: Omit<Advertisement, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("advertisements")
        .insert([newAd])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
      toast({
        title: "Advertisement created",
        description: "The advertisement has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create advertisement: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    advertisements,
    isLoading,
    createAdvertisement,
  };
}