import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types/auth";
import { AuditLogList } from "./AuditLogList";

interface CompanyDetailsProps {
  companyId: string;
  onClose: () => void;
}

export function CompanyDetails({ companyId, onClose }: CompanyDetailsProps) {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (!error && data) {
        setCompany(data);
      }
    };

    fetchCompany();
  }, [companyId]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{company?.name} Details</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AuditLogList companyId={companyId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}