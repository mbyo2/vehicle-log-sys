
import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { Document } from '@/types/document';
import { Button } from '@/components/ui/button';
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
import { FilePenLine, FileText, MoreVertical, Eye, Download, Trash } from 'lucide-react';

interface DocumentListProps {
  vehicleId?: string;
  driverId?: string;
  showVerification?: boolean;
}

export function DocumentList({ vehicleId, driverId, showVerification = false }: DocumentListProps) {
  const { documents: allDocuments, isLoading, getDocumentUrl, deleteDocument } = useDocuments();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  
  // Filter documents based on vehicleId or driverId if provided
  const documents = allDocuments?.filter(doc => {
    if (vehicleId) return doc.vehicle_id === vehicleId;
    if (driverId) return doc.driver_id === driverId;
    return true;
  });

  const handlePreview = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      setPreviewUrl(url);
      setSelectedDocument(document);
    } catch (error) {
      console.error('Error getting document URL:', error);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      const link = document.createElement('a');
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

  if (!documents?.length) {
    return <div className="text-center py-4 text-muted-foreground">No documents found.</div>;
  }

  return (
    <div>
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
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.name}</TableCell>
              <TableCell>{document.type.replace('_', ' ')}</TableCell>
              <TableCell>{getStatusBadge(document.status)}</TableCell>
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
              <TableCell>{format(new Date(document.upload_date), 'dd MMM yyyy')}</TableCell>
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
                    {showVerification && document.status === 'pending' && (
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
