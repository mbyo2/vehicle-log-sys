import { useState } from "react";
import { Upload, CheckCircle, XCircle, Clock, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationNote, setVerificationNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const { toast } = useToast();
  const { profile } = useAuth();

  const { data: categories } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record in the database
      const { error: dbError } = await supabase.from('documents').insert({
        name: file.name,
        type: file.type,
        storage_path: filePath,
        verification_status: 'pending',
        category_id: selectedCategory,
        version: 1,
        version_notes: versionNotes,
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVerification = async (documentId: string, status: 'approved' | 'rejected') => {
    try {
      setVerifying(true);
      
      const { error } = await supabase
        .from('documents')
        .update({
          verification_status: status,
          verified_by: profile?.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNote,
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document ${status} successfully`,
      });
      
      setVerificationNote("");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-4 h-4 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category">
              <div className="flex items-center">
                <FolderOpen className="w-4 h-4 mr-2" />
                Select Category
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Version notes (optional)"
          value={versionNotes}
          onChange={(e) => setVersionNotes(e.target.value)}
        />

        <div className="flex items-center space-x-2">
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading || !selectedCategory}
            className="flex-1"
          />
          <Button disabled={uploading || !selectedCategory}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Document List with Verification Status */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Documents</h3>
        <div className="space-y-4">
          {/* We'll map through documents here */}
          {/* Example document item */}
          <div className="border p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">document.name</h4>
                {getStatusBadge('pending')}
              </div>
              {profile.get()?.role === 'company_admin' && (
                <div className="flex items-center space-x-2">
                  <Textarea
                    placeholder="Verification notes..."
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    className="bg-green-50 hover:bg-green-100"
                    onClick={() => handleVerification('documentId', 'approved')}
                    disabled={verifying}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-50 hover:bg-red-100"
                    onClick={() => handleVerification('documentId', 'rejected')}
                    disabled={verifying}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
