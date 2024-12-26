import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, Download, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuditLogList } from "./AuditLogList";

interface CompanyDetailsProps {
  companyId: string;
  onClose: () => void;
}

export function CompanyDetails({ companyId, onClose }: CompanyDetailsProps) {
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const { toast } = useToast();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data as Company;
    },
  });

  const handleExport = async () => {
    if (!company) return;

    try {
      // Get company data including related audit logs
      const { data: exportData, error } = await supabase
        .from("companies")
        .select(`
          *,
          audit_logs(*)
        `)
        .eq("id", companyId)
        .single();

      if (error) throw error;

      // Create and download CSV file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `company-${company.name}-export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Company data has been exported successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message,
      });
    }
  };

  if (isLoading || !company) {
    return <div>Loading...</div>;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Company Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAuditLogs(true)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Audit Logs
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.logo_url && (
                <div className="mb-4">
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="h-20 w-20 object-cover rounded"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-sm ${
                        company.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {company.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Subscription Type
                  </p>
                  <p className="text-lg capitalize">{company.subscription_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created At
                  </p>
                  <p className="text-lg">
                    {format(new Date(company.created_at), "PPP")}
                  </p>
                </div>
                {company.trial_start_date && company.trial_end_date && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Trial Period
                    </p>
                    <p className="text-lg">
                      {format(new Date(company.trial_start_date), "PPP")} -{" "}
                      {format(new Date(company.trial_end_date), "PPP")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      <Dialog open={showAuditLogs} onOpenChange={setShowAuditLogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Logs</DialogTitle>
            <CardDescription>
              View the history of changes made to this company
            </CardDescription>
          </DialogHeader>
          <AuditLogList companyId={companyId} />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}