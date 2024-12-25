import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompanyForm } from "@/components/company/CompanyForm";
import { useModal } from "@/contexts/ModalContext";
import { Company } from "@/types/auth";
import { CompanyTable } from "@/components/company/CompanyTable";
import { CompanyActions } from "@/components/company/CompanyActions";

export function Companies() {
  const { toast } = useToast();
  const { openModal } = useModal();

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching companies",
          description: error.message,
        });
        throw error;
      }

      return data as Company[];
    },
  });

  const handleAddCompany = () => {
    openModal({
      title: "Add New Company",
      content: <CompanyForm onSuccess={() => refetch()} />,
      size: "lg",
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <CompanyActions onAddCompany={handleAddCompany} />
      <CompanyTable companies={companies || []} onCompanyUpdated={() => refetch()} />
    </div>
  );
}