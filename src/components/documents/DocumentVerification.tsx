import { useState } from "react";
import { FileCheck, FileX, Shield } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function DocumentVerification() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("company_id", profile?.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
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

  const handleVerification = async (documentId: string, status: string, notes: string) => {
    try {
      setVerifying(true);
      const { error } = await supabase
        .from("documents")
        .update({
          verification_status: status,
          verification_notes: notes,
          verified_by: profile?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document verification status updated",
      });
      
      await fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Verification</CardTitle>
        <CardDescription>
          Verify and manage uploaded documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading documents...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        doc.verification_status === "verified"
                          ? "bg-green-100 text-green-800"
                          : doc.verification_status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {doc.verification_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      placeholder="Verification notes"
                      defaultValue={doc.verification_notes || ""}
                      className="h-20"
                      onChange={(e) => {
                        const notes = e.target.value;
                        // Store notes temporarily
                        doc.tempNotes = notes;
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleVerification(doc.id, "verified", doc.tempNotes || "")
                        }
                        disabled={verifying}
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleVerification(doc.id, "rejected", doc.tempNotes || "")
                        }
                        disabled={verifying}
                      >
                        <FileX className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
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