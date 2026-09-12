import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Resolves the `drivers` row that belongs to the signed-in user.
 * Fleet tables reference `drivers.id`, never the profile id.
 */
export function useCurrentDriver() {
  const { profile } = useAuth();
  const profileData = profile.get();
  const profileId = profileData?.id;

  const query = useQuery({
    queryKey: ["current-driver", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await supabase
        .from("drivers")
        .select("id, man_number, company_id, license_number, license_expiry")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  return {
    driver: query.data ?? null,
    driverId: query.data?.id ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    companyId: query.data?.company_id ?? profileData?.company_id ?? null,
  };
}
