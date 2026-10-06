import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentUpload } from "./DocumentUpload";
import { differenceInCalendarDays, format } from "date-fns";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

interface Props {
  companyId: string;
  mode: "expiring" | "expired";
}

export function useExpiryCounts(companyId: string) {
  return useQuery({
    queryKey: ["document-expiry", companyId],
    queryFn: async () => {
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, type, expiry_date, version, vehicle_id, driver_id, vehicles (plate_number)")
        .eq("company_id", companyId)
        .not("expiry_date", "is", null)
        .lte("expiry_date", in30)
        .order("expiry_date");
      if (error) throw error;
      // Hide documents that already have a newer renewal
      const { data: children } = await supabase
        .from("documents")
        .select("parent_document_id")
        .eq("company_id", companyId)
        .not("parent_document_id", "is", null);
      const renewed = new Set((children || []).map((c) => c.parent_document_id));
      const today = new Date().toISOString().slice(0, 10);
      const active = (data || []).filter((d) => !renewed.has(d.id));
      return {
        expiring: active.filter((d) => d.expiry_date! >= today),
        expired: active.filter((d) => d.expiry_date! < today),
      };
    },
    enabled: !!companyId,
  });
}

export function ExpiringDocuments({ companyId, mode }: Props) {
  const { data, isLoading, refetch } = useExpiryCounts(companyId);
  const [renewing, setRenewing] = useState<any | null>(null);
  const docs = data?.[mode] || [];

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title={mode === "expired" ? "No expired documents" : "Nothing expiring in the next 30 days"}
        description="Documents with an expiry date appear here when they need renewing."
      />
    );
  }

  return (
    <div className="space-y-3">
      {docs.map((d: any) => {
        const days = differenceInCalendarDays(new Date(d.expiry_date), new Date());
        return (
          <Card key={d.id}>
            <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-sm text-muted-foreground">
                  {d.type.replace(/_/g, " ")}{d.vehicles?.plate_number ? ` · ${d.vehicles.plate_number}` : ""} · expires {format(new Date(d.expiry_date), "MMM dd, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={days < 0 ? "destructive" : days <= 7 ? "destructive" : "secondary"}>
                  {days < 0 ? `Expired ${-days} day${days === -1 ? "" : "s"} ago` : days === 0 ? "Expires today" : `${days} day${days === 1 ? "" : "s"} left`}
                </Badge>
                <Button size="sm" onClick={() => setRenewing(d)}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Renew
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!renewing} onOpenChange={(o) => !o && setRenewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renew {renewing?.name}</DialogTitle></DialogHeader>
          {renewing && (
            <DocumentUpload
              companyId={companyId}
              renewOf={renewing}
              onSuccess={() => { setRenewing(null); refetch(); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
