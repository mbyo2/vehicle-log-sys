
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
import { Upload, FileText, BellRing } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Documents() {
  const { profile } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { sendNotification } = useNotifications();
  
  // Get the actual values using .get()
  const profileData = profile?.get();
  const companyId = profileData?.company_id;
  const userId = profileData?.id;
  const isAdmin = profileData?.role === 'company_admin' || profileData?.role === 'super_admin';

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">No Company Selected</h2>
        <p className="text-muted-foreground">You need to be part of a company to manage documents.</p>
      </div>
    );
  }

  const handleSendReminder = async () => {
    if (!userId) return;
    
    try {
      await sendNotification.mutateAsync({
        to: [userId],
        subject: "Document Expiry Reminder",
        type: "document_expiry",
        details: {
          message: "Some documents are expiring soon. Please check the documents section.",
          actionRequired: "Review expiring documents and renew them before they expire.",
          link: "/documents?tab=expiring"
        },
        delivery: "all" // Send via all channels (in-app, email, SMS)
      });
    } catch (error) {
      console.error("Failed to send notification", error);
    }
  };

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Documents</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleSendReminder}>
              <BellRing className="mr-2 h-4 w-4" />
              Send Reminders
            </Button>
          )}
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
      </div>

      <Alert className="mb-6">
        <BellRing className="h-4 w-4" />
        <AlertTitle>Automatic Notifications</AlertTitle>
        <AlertDescription>
          Our system will automatically notify you via email when documents are about to expire.
          For urgent matters, SMS notifications will be sent to your registered number.
        </AlertDescription>
      </Alert>

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
