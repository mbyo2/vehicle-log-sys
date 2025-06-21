
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { EnhancedDocumentList } from '@/components/documents/EnhancedDocumentList';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VehicleDocumentsProps {
  vehicleId: string;
  companyId: string;
}

export function VehicleDocuments({ vehicleId, companyId }: VehicleDocumentsProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vehicle Documents
          </div>
        </CardTitle>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Vehicle Document</DialogTitle>
            </DialogHeader>
            <DocumentUpload 
              companyId={companyId} 
              vehicleId={vehicleId}
              onSuccess={() => setIsUploadOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <EnhancedDocumentList 
          vehicleId={vehicleId} 
          companyId={companyId}
          showVerification={true}
        />
      </CardContent>
    </Card>
  );
}
