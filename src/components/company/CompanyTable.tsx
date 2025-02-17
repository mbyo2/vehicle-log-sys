import { Company } from "@/types/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/contexts/ModalContext";
import { CompanyEditForm } from "./CompanyEditForm";
import { CompanyDetails } from "./CompanyDetails";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface CompanyTableProps {
  companies: Company[];
  onCompanyUpdated: () => void;
}

export function CompanyTable({ companies, onCompanyUpdated }: CompanyTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const { toast } = useToast();
  const { openModal } = useModal();

  const handleEdit = (company: Company) => {
    openModal({
      title: "Edit Company",
      content: <CompanyEditForm company={company} onSuccess={onCompanyUpdated} />,
      size: "lg",
    });
  };

  const handleDelete = async (company: Company) => {
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      onCompanyUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting company",
        description: error.message,
      });
    } finally {
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Trial Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies?.map((company) => (
            <TableRow key={company.id}>
              <TableCell>
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="h-8 w-8 rounded object-contain bg-white"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>
                <Badge variant={company.subscription_type === 'trial' ? 'secondary' : 'default'}>
                  {company.subscription_type}
                </Badge>
              </TableCell>
              <TableCell>
                {company.trial_start_date && company.trial_end_date ? (
                  <span className="text-sm">
                    {format(new Date(company.trial_start_date), "MMM d, yyyy")} -{" "}
                    {format(new Date(company.trial_end_date), "MMM d, yyyy")}
                  </span>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                <Badge variant={company.is_active ? "success" : "destructive"}>
                  {company.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(company.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCompany(company.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(company)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCompanyToDelete(company);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => companyToDelete && handleDelete(companyToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCompany && (
        <CompanyDetails
          companyId={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
