
import { useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, Signal, SignalLow } from 'lucide-react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionStatus({ className, showDetails = false }: ConnectionStatusProps) {
  const { isOnline, connectionQuality, checkConnectionSpeed, lastChecked } = useConnectivity();
  
  useEffect(() => {
    // Check connection on mount
    checkConnectionSpeed();
    
    // Check connection periodically
    const interval = setInterval(() => {
      checkConnectionSpeed();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnectionSpeed]);
  
  if (!isOnline) {
    return (
      <div className={cn(
        "flex items-center px-3 py-1 text-xs rounded-full bg-red-100 text-red-800", 
        className
      )}>
        <WifiOff className="h-3 w-3 mr-1" />
        <span className="mr-1">Offline</span>
        {showDetails && <span className="text-xs text-red-600">(Sync disabled)</span>}
      </div>
    );
  }
  
  if (connectionQuality === 'poor') {
    return (
      <div className={cn(
        "flex items-center px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-800", 
        className
      )}>
        <SignalLow className="h-3 w-3 mr-1" />
        <span>Slow Connection</span>
        {showDetails && lastChecked && (
          <span className="text-xs ml-1">
            (Last checked: {new Date(lastChecked).toLocaleTimeString()})
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex items-center px-3 py-1 text-xs rounded-full bg-green-100 text-green-800", 
      className
    )}>
      {connectionQuality === 'excellent' ? (
        <Signal className="h-3 w-3 mr-1" />
      ) : (
        <Wifi className="h-3 w-3 mr-1" />
      )}
      <span>{connectionQuality === 'excellent' ? 'Excellent' : 'Online'}</span>
      {showDetails && lastChecked && (
        <span className="text-xs ml-1">
          (Last checked: {new Date(lastChecked).toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}
