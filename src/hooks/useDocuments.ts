
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentType } from '@/types/document';

export function useDocuments() {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
  });

  const getVehicleDocuments = (vehicleId: string) => {
    return useQuery({
      queryKey: ['vehicle-documents', vehicleId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('upload_date', { ascending: false });
        
        if (error) throw error;
        return data as Document[];
      },
    });
  };

  const getDriverDocuments = (driverId: string) => {
    return useQuery({
      queryKey: ['driver-documents', driverId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('driver_id', driverId)
          .order('upload_date', { ascending: false });
        
        if (error) throw error;
        return data as Document[];
      },
    });
  };

  const uploadDocument = async (
    file: File,
    documentInfo: {
      name: string;
      type: DocumentType;
      expiry_date?: string;
      company_id: string;
      vehicle_id?: string;
      driver_id?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    try {
      setIsUploading(true);
      
      // Create folder structure: documents/company_id/document_type/
      const folderPath = `${documentInfo.company_id}/${documentInfo.type}/`;
      const filePath = `${folderPath}${Date.now()}_${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      // Create document record in database
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          name: documentInfo.name,
          file_path: filePath,
          type: documentInfo.type,
          expiry_date: documentInfo.expiry_date,
          company_id: documentInfo.company_id,
          vehicle_id: documentInfo.vehicle_id,
          driver_id: documentInfo.driver_id,
          metadata: documentInfo.metadata || {},
        });

      if (insertError) throw insertError;
      
      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (documentInfo.vehicle_id) {
        queryClient.invalidateQueries({ queryKey: ['vehicle-documents', documentInfo.vehicle_id] });
      }
      if (documentInfo.driver_id) {
        queryClient.invalidateQueries({ queryKey: ['driver-documents', documentInfo.driver_id] });
      }

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const verifyDocument = useMutation({
    mutationFn: async ({ 
      documentId, 
      status, 
      notes 
    }: { 
      documentId: string; 
      status: 'verified' | 'rejected'; 
      notes?: string 
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({
          status: status,
          verification_notes: notes,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Document verified",
        description: "The document status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message,
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // First get the document details to know the file path
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);
      
      if (storageError) throw storageError;
      
      // Delete the document record
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    },
  });

  const getDocumentUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
    
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents,
    isLoading,
    isUploading,
    uploadDocument,
    verifyDocument,
    deleteDocument,
    getDocumentUrl,
    getVehicleDocuments,
    getDriverDocuments,
  };
}
