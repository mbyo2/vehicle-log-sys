
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DocumentType } from '@/types/document';
import { fileValidation } from '@/lib/validation';

interface DocumentUploadData {
  name: string;
  type: DocumentType;
  expiry_date?: string;
  company_id: string;
  vehicle_id?: string;
  driver_id?: string;
}

export function useDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          verified_by:profiles!documents_verified_by_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ file, documentData }: { file: File; documentData: DocumentUploadData }) => {
      // Validate file
      const validation = fileValidation.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${documentData.company_id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Insert document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          ...documentData,
          storage_path: filePath,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message,
      });
    },
  });

  const getDocumentUrl = async (filePath: string) => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const verifyDocument = useMutation({
    mutationFn: async ({
      documentId,
      status,
      notes
    }: {
      documentId: string;
      status: 'verified' | 'rejected';
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({
          verification_status: status,
          verification_notes: notes,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success",
        description: "Document verification status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // Get document details first
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (document.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.storage_path]);

        if (storageError) {
          console.warn('Storage deletion failed:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    documents,
    isLoading,
    uploadDocument,
    getDocumentUrl,
    verifyDocument,
    deleteDocument,
    isUploading: uploadDocument.isPending,
  };
}
