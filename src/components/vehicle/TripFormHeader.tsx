
import { Wifi, WifiOff, RotateCw, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/use-mobile';

interface TripFormHeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingRecords?: number;
  syncOfflineData: () => void;
}

export const TripFormHeader = ({ 
  isOnline, 
  isSyncing, 
  pendingRecords = 0, 
  syncOfflineData 
}: TripFormHeaderProps) => {
  const { permission, requestPermission, sendTestNotification } = usePushNotifications();
  
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Trip Log</h2>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-yellow-500" />
          )}
          <span className="text-sm">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-2">
          {pendingRecords > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
              {pendingRecords} pending records
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncOfflineData}
            disabled={isSyncing || !pendingRecords}
            className="flex items-center gap-1"
          >
            <RotateCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={permission === 'granted' ? sendTestNotification : requestPermission}
            className="flex items-center gap-1"
          >
            {permission === 'granted' ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            <span>{permission === 'granted' ? 'Test Alert' : 'Enable Alerts'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
