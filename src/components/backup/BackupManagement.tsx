import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Database, Save, Archive } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function BackupManagement() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const { data, error } = await supabase
        .from("backup_logs")
        .select("*")
        .eq("company_id", profile?.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: string) => {
    try {
      setCreating(true);
      const { error } = await supabase.from("backup_logs").insert({
        company_id: profile?.company_id,
        backup_type: type,
        status: "pending",
        started_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Backup initiated successfully",
      });
      
      await fetchBackups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup Management</CardTitle>
        <CardDescription>
          Manage and monitor your system backups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex space-x-4">
          <Button
            onClick={() => createBackup("full")}
            disabled={creating}
          >
            <Database className="w-4 h-4 mr-2" />
            Full Backup
          </Button>
          <Button
            variant="outline"
            onClick={() => createBackup("incremental")}
            disabled={creating}
          >
            <Save className="w-4 h-4 mr-2" />
            Incremental Backup
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading backups...
                </TableCell>
              </TableRow>
            ) : backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No backups found
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>
                    {format(new Date(backup.created_at), "PPpp")}
                  </TableCell>
                  <TableCell className="capitalize">{backup.backup_type}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        backup.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : backup.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {backup.status}
                    </span>
                  </TableCell>
                  <TableCell>{formatSize(backup.size_bytes)}</TableCell>
                  <TableCell>
                    {backup.completed_at
                      ? `${Math.round(
                          (new Date(backup.completed_at).getTime() -
                            new Date(backup.started_at).getTime()) /
                            1000
                        )}s`
                      : "In progress"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}