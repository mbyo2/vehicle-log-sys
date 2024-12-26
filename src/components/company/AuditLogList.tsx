import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLogListProps {
  companyId: string;
}

export function AuditLogList({ companyId }: AuditLogListProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-logs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("performed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading audit logs...</div>;
  }

  if (!auditLogs?.length) {
    return <div>No audit logs found</div>;
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Changes</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="capitalize">{log.action}</TableCell>
              <TableCell>
                {log.new_data && (
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(log.new_data, null, 2)}
                  </pre>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(log.performed_at), "PPp")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
  );
}