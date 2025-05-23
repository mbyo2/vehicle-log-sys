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

interface DocumentVersion {
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
  const { data: versions, isLoading } = useQuery({
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
          created_by:created_by (
            full_name
          )
        `)
        .eq("parent_document_id", documentId)
        .order("version", { ascending: false });

      if (error) throw error;
      
      // Ensure the response matches our interface
      const typedData = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        version: item.version,
        version_notes: item.version_notes,
        created_at: item.created_at,
        created_by: item.created_by
      })) as DocumentVersion[];
      
      return typedData;
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