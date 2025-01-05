import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { supabase } from "@/integrations/supabase/client";

interface AuditLogListProps {
  companyId: string;
}

export function AuditLogList({ companyId }: AuditLogListProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let query = supabase
          .from("audit_logs")
          .select("*")
          .eq("company_id", companyId)
          .order("performed_at", { ascending: false });

        if (selectedTable !== "all") {
          query = query.eq("table_name", selectedTable);
        }

        const { data, error } = await query;

        if (error) throw error;
        setLogs(data || []);

        // Get unique table names using Set
        const uniqueTableNames = [...new Set(data?.map(log => log.table_name) || [])];
        setTableNames(uniqueTableNames);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [companyId, selectedTable]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedTable}
          onValueChange={setSelectedTable}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tableNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.performed_at), "PPpp")}
                  </TableCell>
                  <TableCell>{log.table_name}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    <pre className="text-sm">
                      {JSON.stringify(log.new_data || log.old_data, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}