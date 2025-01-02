import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CompanySettingsForm } from "@/components/company/CompanySettingsForm";
import { Company } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const { data: company, refetch } = useQuery({
    queryKey: ["company", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile?.company_id)
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching company",
          description: error.message,
        });
        throw error;
      }

      return data as Company;
    },
    enabled: !!profile?.company_id,
  });

  if (!company) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <CompanySettingsForm company={company} onSuccess={() => refetch()} />
    </div>
  );
}