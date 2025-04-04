
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CloudOff, Wifi } from 'lucide-react';
import { useConnectivity } from '@/hooks/useConnectivity';

export function OfflineBanner() {
  const { isOnline } = useConnectivity();
  const [showReconnected, setShowReconnected] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isOnline && !showReconnected) {
      setShowReconnected(true);
      timeout = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOnline]);
  
  if (isOnline && !showReconnected) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline ? (
        <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-800">
          <CloudOff className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-400">
            You're currently offline. Some features might not work properly.
          </AlertDescription>
        </Alert>
      ) : showReconnected ? (
        <Alert className="bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-800">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertDescription className="text-green-800 dark:text-green-400">
            Back online! All features are now available.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
