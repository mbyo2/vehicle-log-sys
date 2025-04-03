
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
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
      label: 'Approved'
    },
    pending: {
      icon: Clock,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      label: 'Pending Approval'
    },
    rejected: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-300',
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
