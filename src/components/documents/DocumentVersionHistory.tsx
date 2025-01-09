import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { History, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DocumentVersionHistory {
  id: string;
  name: string;
  version: number;
  version_notes: string | null;
  created_at: string;
  created_by: {
    full_name: string | null;
  } | null;
}

interface DocumentVersionHistoryProps {
  documentId: string;
}

export function DocumentVersionHistory({ documentId }: DocumentVersionHistoryProps) {
  const { data: versions, isLoading } = useQuery<DocumentVersionHistory[]>({
    queryKey: ["document-versions", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          id,
          name,
          version,
          version_notes,
          created_at,
          created_by (
            full_name
          )
        `)
        .eq("parent_document_id", documentId)
        .order("version", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading version history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <History className="w-5 h-5 mr-2" />
        <h3 className="text-lg font-semibold">Version History</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions?.map((version) => (
            <TableRow key={version.id}>
              <TableCell>v{version.version}</TableCell>
              <TableCell>{version.version_notes || "No notes"}</TableCell>
              <TableCell>{version.created_by?.full_name || "Unknown"}</TableCell>
              <TableCell>
                {new Date(version.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}