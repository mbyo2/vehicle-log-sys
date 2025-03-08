
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Upload, FileText } from 'lucide-react';

export default function Documents() {
  const { profile } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const companyId = profile?.company_id;
  const isAdmin = profile?.role === 'company_admin' || profile?.role === 'super_admin';

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">No Company Selected</h2>
        <p className="text-muted-foreground">You need to be part of a company to manage documents.</p>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <DocumentUpload 
              companyId={companyId} 
              onSuccess={() => setIsUploadOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="bg-white rounded-md shadow">
            <DocumentList showVerification={isAdmin} />
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="bg-white rounded-md shadow">
            {/* You would filter documents by status here */}
            <DocumentList showVerification={isAdmin} />
          </div>
        </TabsContent>
        
        <TabsContent value="expiring">
          <div className="bg-white rounded-md shadow">
            {/* You would filter documents by expiry here */}
            <DocumentList showVerification={isAdmin} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
