
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CloudOff, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  if (isOnline && pendingRecords === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      {!isOnline && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <CloudOff className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You're currently offline. Trip logs will be saved locally and synchronized when you're back online.
          </AlertDescription>
        </Alert>
      )}
      
      {pendingRecords > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle>Offline data pending sync</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <div>
              You have {pendingRecords} trip{pendingRecords > 1 ? 's' : ''} stored offline.
            </div>
            {isOnline && (
              <Button 
                variant="outline" 
                className="ml-2 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
                onClick={syncOfflineData}
                disabled={isSyncing}
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
