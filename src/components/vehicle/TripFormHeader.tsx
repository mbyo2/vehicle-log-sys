
import { Wifi, WifiOff, RotateCw, Bell, BellOff, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-xs font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isOnline ? 'Connected to the server' : 'Working offline - data will be synced when connection is restored'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-2">
          {pendingRecords > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300 flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>{pendingRecords} pending</span>
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncOfflineData}
                  disabled={isSyncing || !pendingRecords || !isOnline}
                  className="flex items-center gap-1"
                >
                  <RotateCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{pendingRecords > 0 ? `Sync ${pendingRecords} offline records to server` : 'No pending records to sync'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{permission === 'granted' 
                  ? 'Send a test notification to verify your browser supports notifications' 
                  : 'Enable notifications to receive alerts when offline data is synced'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {!isOnline && (
        <div className="mt-1 text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
          You're currently offline. Your trip logs will be saved locally and synchronized when you're back online.
        </div>
      )}
    </div>
  );
};
