
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface TripFormStatusProps {
  approvalStatus: string;
  approvalComment?: string;
  totalKilometers: number;
}

export const TripFormStatus: React.FC<TripFormStatusProps> = ({
  approvalStatus,
  approvalComment,
  totalKilometers
}) => {
  const isMobile = useIsMobile();
  
  // Status color mapping
  const statusConfig = {
    approved: {
      icon: Check,
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      textColor: 'text-success',
      label: 'Approved'
    },
    pending: {
      icon: Clock,
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      textColor: 'text-warning',
      label: 'Pending Approval'
    },
    rejected: {
      icon: AlertTriangle,
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      textColor: 'text-destructive',
      label: 'Rejected'
    }
  };
  
  const config = statusConfig[approvalStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${isMobile ? 'text-muted-foreground' : ''}`}>Total Distance</span>
        <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>{totalKilometers} km</span>
      </div>
      
      {approvalStatus && (
        <Card className={`${config.bgColor} border ${config.borderColor}`}>
          <CardContent className={`py-3 ${isMobile ? 'px-3' : 'px-4'} flex items-center`}>
            <StatusIcon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 ${config.textColor}`} />
            <div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${config.textColor}`}>
                {config.label}
              </div>
              {approvalComment && (
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
                  {approvalComment}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
