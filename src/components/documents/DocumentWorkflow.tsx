
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  FileText,
  Eye
} from 'lucide-react';
import { Document } from '@/types/document';
import { format } from 'date-fns';

interface DocumentWorkflowProps {
  companyId: string;
}

export function DocumentWorkflow({ companyId }: DocumentWorkflowProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['workflow-documents', companyId, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId);

      if (selectedStatus !== 'all') {
        query = query.eq('verification_status', selectedStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
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

  const getExpiryWarning = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive" className="ml-2">Expired</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-600 ml-2">Expires in {daysUntilExpiry} days</Badge>;
    }
    return null;
  };

  const statusCounts = {
    all: documents?.length || 0,
    pending: documents?.filter(d => d.verification_status === 'pending').length || 0,
    verified: documents?.filter(d => d.verification_status === 'verified').length || 0,
    rejected: documents?.filter(d => d.verification_status === 'rejected').length || 0,
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading workflow...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card 
            key={status}
            className={`cursor-pointer transition-colors ${
              selectedStatus === status ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedStatus(status)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {status === 'all' ? 'Total' : status}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents?.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(document.verification_status)}
                  <div>
                    <div className="font-medium">{document.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {document.type.replace('_', ' ')} • 
                      Created {format(new Date(document.created_at), 'MMM dd, yyyy')}
                      {document.expiry_date && (
                        <> • Expires {format(new Date(document.expiry_date), 'MMM dd, yyyy')}</>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getExpiryWarning(document.expiry_date)}
                  {getStatusBadge(document.verification_status)}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {!documents?.length && (
              <div className="text-center py-8 text-muted-foreground">
                No documents found for the selected status.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
