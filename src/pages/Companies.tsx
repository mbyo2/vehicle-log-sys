
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompanyForm } from "@/components/company/CompanyForm";
import { useModal } from "@/contexts/ModalContext";
import { Company } from "@/types/auth";
import { CompanyTable } from "@/components/company/CompanyTable";
import { CompanyActions } from "@/components/company/CompanyActions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Companies() {
  const { toast } = useToast();
  const { openModal } = useModal();

  const { data: companies, isLoading, error, refetch } = useQuery({
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load companies. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CompanyActions onAddCompany={handleAddCompany} />
      {companies?.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No companies yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first company
          </p>
          <Button variant="default" onClick={handleAddCompany}>
            Add Company
          </Button>
        </div>
      ) : (
        <CompanyTable companies={companies || []} onCompanyUpdated={() => refetch()} />
      )}
    </div>
  );
}
