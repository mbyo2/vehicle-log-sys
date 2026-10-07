
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CloudOff, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";

interface TripFormHeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingRecords: number;
  syncOfflineData: () => void;
}

export const TripFormHeader: React.FC<TripFormHeaderProps> = ({
  isOnline,
  isSyncing,
  pendingRecords,
  syncOfflineData
}) => {
  const isMobile = useIsMobile();

  if (isOnline && pendingRecords === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      {!isOnline && (
        <Alert className="bg-warning/10 border-warning/30">
          <CloudOff className="h-4 w-4 text-warning" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription className={isMobile ? "text-sm" : ""}>
            You're currently offline. Trip logs will be saved locally and synchronized when you're back online.
          </AlertDescription>
        </Alert>
      )}
      
      {pendingRecords > 0 && (
        <Alert className="bg-info/10 border-info/30">
          <AlertTriangle className="h-4 w-4 text-info" />
          <AlertTitle>Offline data pending sync</AlertTitle>
          <AlertDescription className={`${isMobile ? "text-sm flex flex-col space-y-2" : "flex justify-between items-center"}`}>
            <div>
              You have {pendingRecords} trip{pendingRecords > 1 ? 's' : ''} stored offline.
            </div>
            {isOnline && (
              <Button 
                variant="outline" 
                className={`${isMobile ? "w-full mt-2" : "ml-2 h-8"} bg-info/10 hover:bg-info/10 text-info border-info/30`}
                onClick={syncOfflineData}
                disabled={isSyncing}
                size={isMobile ? "sm" : "default"}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
