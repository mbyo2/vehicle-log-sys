
import { useEffect } from 'react';
import { CloudSync, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusProps {
  className?: string;
}

export function SyncStatus({ className }: SyncStatusProps) {
  const { pendingRecords, isSyncing, syncOfflineData, checkPendingRecords, isOnline } = useOfflineSync();
  
  // Check for pending records when the component mounts or online status changes
  useEffect(() => {
    if (isOnline) {
      checkPendingRecords();
    }
  }, [isOnline, checkPendingRecords]);
  
  // No pending records, don't show anything
  if (pendingRecords === 0) {
    return null;
  }
  
  // Show pending records with sync button when online
  if (isOnline) {
    return (
      <div className={cn(
        "flex items-center gap-2",
        className
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "gap-1 text-xs", 
                isSyncing ? "bg-blue-50" : "bg-amber-50"
              )}
              onClick={() => syncOfflineData()}
              disabled={isSyncing}
            >
              <CloudSync className={cn(
                "h-3.5 w-3.5", 
                isSyncing && "animate-spin"
              )} />
              {isSyncing ? 'Syncing...' : `Sync data (${pendingRecords})`}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {pendingRecords} {pendingRecords === 1 ? 'record' : 'records'} waiting to be synced
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
  
  // Show just an indicator when offline
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-800 rounded-md",
      className
    )}>
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{pendingRecords} offline {pendingRecords === 1 ? 'record' : 'records'}</span>
    </div>
  );
}
