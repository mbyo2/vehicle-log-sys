import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { CompanyForm } from "@/components/company/CompanyForm";
import { useModal } from "@/contexts/ModalContext";
import { Company } from "@/types/auth";

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Companies</h1>
        <Button onClick={handleAddCompany}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Trial Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies?.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.name}</TableCell>
              <TableCell className="capitalize">{company.subscription_type}</TableCell>
              <TableCell>
                {company.trial_start_date && company.trial_end_date ? (
                  `${format(new Date(company.trial_start_date), "PP")} - ${format(
                    new Date(company.trial_end_date),
                    "PP"
                  )}`
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    company.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {company.is_active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>{format(new Date(company.created_at), "PP")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}