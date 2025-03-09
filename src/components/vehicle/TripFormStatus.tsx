
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TripFormStatusProps {
  approvalStatus: 'approved' | 'rejected' | 'pending';
  approvalComment?: string;
  totalKilometers?: number;
}

export const TripFormStatus = ({
  approvalStatus,
  approvalComment,
  totalKilometers
}: TripFormStatusProps) => {
  const isMobile = useIsMobile();
  
  const getStatusIcon = () => {
    switch (approvalStatus) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  const getStatusBadge = () => {
    switch (approvalStatus) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending Approval
          </Badge>
        );
    }
  };
  
  return (
    <Card className={`p-4 ${isMobile ? 'text-sm' : ''}`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className="font-medium">Status</p>
            <div className="mt-1">{getStatusBadge()}</div>
          </div>
        </div>
        
        {totalKilometers !== undefined && (
          <div className={`${isMobile ? 'border-t pt-3' : ''}`}>
            <p className="text-sm text-muted-foreground">Total Distance</p>
            <p className="text-lg font-semibold">{totalKilometers} km</p>
          </div>
        )}
      </div>
      
      {approvalComment && (
        <div className={`${isMobile ? 'mt-3' : 'mt-2'} border-t pt-3`}>
          <p className="text-sm font-medium mb-1">Comments from Supervisor:</p>
          <p className="text-sm text-muted-foreground">{approvalComment}</p>
        </div>
      )}
    </Card>
  );
};
