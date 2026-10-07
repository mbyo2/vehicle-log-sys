
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
        <Alert className="bg-warning/10 border-warning/30">
          <CloudOff className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            You're currently offline. Some features might not work properly.
          </AlertDescription>
        </Alert>
      ) : showReconnected ? (
        <Alert className="bg-success/10 border-success/30">
          <Wifi className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Back online! All features are now available.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
