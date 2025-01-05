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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AuditLogListProps {
  companyId?: string;
}

export function AuditLogList({ companyId }: AuditLogListProps) {
  const [filterTable, setFilterTable] = useState<string>("all");

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-logs", filterTable],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*, profiles(full_name)")
        .order("performed_at", { ascending: false });

      if (filterTable !== "all") {
        query = query.eq("table_name", filterTable);
      }

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: tables } = useQuery({
    queryKey: ["audit-tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("table_name");

      // Get unique table names
      const uniqueTables = Array.from(new Set(data?.map(d => d.table_name) || []));
      if (error) throw error;
      return uniqueTables;
    },
  });

  if (isLoading) {
    return <div>Loading audit logs...</div>;
  }

  if (!auditLogs?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No audit logs found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tables?.map((table) => (
              <SelectItem key={table} value={table}>
                {table.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  {log.table_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </TableCell>
                <TableCell className="capitalize">{log.action}</TableCell>
                <TableCell className="max-w-md">
                  {log.new_data && (
                    <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-32">
                      {JSON.stringify(log.new_data, null, 2)}
                    </pre>
                  )}
                </TableCell>
                <TableCell>{log.profiles?.full_name}</TableCell>
                <TableCell>
                  {format(new Date(log.performed_at), "PPp")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}