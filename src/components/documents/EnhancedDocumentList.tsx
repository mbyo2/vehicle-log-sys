
import { useState, useMemo } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '@/types/document';
import { DocumentFilter, DocumentFilters } from './DocumentFilter';
import { DocumentWorkflow } from './DocumentWorkflow';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { DocumentVerification } from './DocumentVerification';
import { FilePenLine, FileText, MoreVertical, Eye, Download, Trash, Grid, List } from 'lucide-react';

interface EnhancedDocumentListProps {
  vehicleId?: string;
  driverId?: string;
  showVerification?: boolean;
  companyId: string;
}

export function EnhancedDocumentList({ 
  vehicleId, 
  driverId, 
  showVerification = false,
  companyId 
}: EnhancedDocumentListProps) {
  const { documents: allDocuments, isLoading, getDocumentUrl, deleteDocument } = useDocuments();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    type: '',
    status: '',
    category: '',
    expiringSoon: false,
    expired: false,
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['document-categories', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('id, name')
        .eq('company_id', companyId);
      if (error) throw error;
      return data;
    },
  });

  // Filter documents based on props and filters
  const filteredDocuments = useMemo(() => {
    let docs = allDocuments?.filter(doc => {
      if (vehicleId && doc.vehicle_id !== vehicleId) return false;
      if (driverId && doc.driver_id !== driverId) return false;
      return true;
    }) || [];

    // Apply search filter
    if (filters.search) {
      docs = docs.filter(doc => 
        doc.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.type.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply type filter
    if (filters.type) {
      docs = docs.filter(doc => doc.type === filters.type);
    }

    // Apply status filter
    if (filters.status) {
      docs = docs.filter(doc => doc.verification_status === filters.status);
    }

    // Apply category filter
    if (filters.category) {
      docs = docs.filter(doc => doc.metadata?.category_id === filters.category);
    }

    // Apply expiry filters
    if (filters.expiringSoon || filters.expired) {
      docs = docs.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.expired && daysUntilExpiry < 0) return true;
        if (filters.expiringSoon && daysUntilExpiry > 0 && daysUntilExpiry <= 30) return true;
        return false;
      });
    }

    return docs;
  }, [allDocuments, vehicleId, driverId, filters]);

  const handlePreview = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document.storage_path);
      setPreviewUrl(url);
      setSelectedDocument(document);
    } catch (error) {
      console.error('Error getting document URL:', error);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document.storage_path);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      link.click();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="outline" className="bg-green-50 text-green-600">Verified</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600">Pending</Badge>;
    }
  };

  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <DocumentFilter 
              onFilterChange={setFilters} 
              categories={categories || []} 
            />
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.name}</TableCell>
                    <TableCell>{document.type.replace('_', ' ')}</TableCell>
                    <TableCell>{getStatusBadge(document.verification_status)}</TableCell>
                    <TableCell>
                      {document.expiry_date ? (
                        <span className={cn(
                          isExpired(document.expiry_date) && "text-red-600",
                          isExpiringSoon(document.expiry_date) && "text-amber-600"
                        )}>
                          {format(new Date(document.expiry_date), 'dd MMM yyyy')}
                          {isExpired(document.expiry_date) && " (Expired)"}
                          {!isExpired(document.expiry_date) && isExpiringSoon(document.expiry_date) && " (Expiring soon)"}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(document.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreview(document)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          {showVerification && document.verification_status === 'pending' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <FilePenLine className="mr-2 h-4 w-4" />
                                  Verify
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Verify Document</DialogTitle>
                                </DialogHeader>
                                <DocumentVerification document={document} />
                              </DialogContent>
                            </Dialog>
                          )}
                          <DropdownMenuItem onClick={() => setDocToDelete(document.id)} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <FileText className="h-8 w-8 text-blue-500" />
                    {getStatusBadge(document.verification_status)}
                  </div>
                  <div>
                    <h3 className="font-medium truncate">{document.name}</h3>
                    <p className="text-sm text-muted-foreground">{document.type.replace('_', ' ')}</p>
                  </div>
                  {document.expiry_date && (
                    <div className="text-sm">
                      <span className={cn(
                        "font-medium",
                        isExpired(document.expiry_date) && "text-red-600",
                        isExpiringSoon(document.expiry_date) && "text-amber-600"
                      )}>
                        Expires: {format(new Date(document.expiry_date), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(document)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!filteredDocuments.length && (
            <div className="text-center py-8 text-muted-foreground">
              No documents found matching your filters.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="workflow">
          <DocumentWorkflow companyId={companyId} />
        </TabsContent>
      </Tabs>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto">
            {previewUrl && (
              <iframe 
                src={previewUrl} 
                className="w-full h-full" 
                title={selectedDocument?.name || 'Document preview'} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (docToDelete) {
                  deleteDocument.mutate(docToDelete);
                  setDocToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
