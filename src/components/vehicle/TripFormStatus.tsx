import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface TripFormStatusProps {
  approvalStatus: string;
  approvalComment?: string;
  totalKilometers: number;
}

export const TripFormStatus = ({ approvalStatus, approvalComment, totalKilometers }: TripFormStatusProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className={getStatusColor(approvalStatus)}>
          Status: {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
        </Badge>
        {totalKilometers > 0 && (
          <div className="bg-primary/10 p-2 rounded-md">
            <p className="text-sm font-medium">
              Distance: <span className="text-primary">{totalKilometers} km</span>
            </p>
          </div>
        )}
      </div>
      
      {approvalComment && (
        <Card className="p-4 bg-muted">
          <p className="text-sm font-medium">Approval Comment:</p>
          <p className="text-sm mt-1">{approvalComment}</p>
        </Card>
      )}
    </div>
  );
};