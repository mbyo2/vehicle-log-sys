
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, AlertTriangle } from 'lucide-react';

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
  // Status color mapping
  const statusConfig = {
    approved: {
      icon: Check,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      label: 'Approved'
    },
    pending: {
      icon: Clock,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      label: 'Pending Approval'
    },
    rejected: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      label: 'Rejected'
    }
  };
  
  const config = statusConfig[approvalStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Total Distance</span>
        <span className="text-lg font-bold">{totalKilometers} km</span>
      </div>
      
      {approvalStatus && (
        <Card className={`${config.bgColor} border-${config.borderColor}`}>
          <CardContent className="py-3 px-4 flex items-center">
            <StatusIcon className={`h-4 w-4 mr-2 ${config.textColor}`} />
            <div>
              <div className={`text-sm font-medium ${config.textColor}`}>
                {config.label}
              </div>
              {approvalComment && (
                <div className="text-xs mt-1">
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
