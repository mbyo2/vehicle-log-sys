
import { useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const { isOnline, connectionQuality, checkConnectionSpeed } = useConnectivity();
  
  useEffect(() => {
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
        <span>Offline</span>
      </div>
    );
  }
  
  if (connectionQuality === 'poor') {
    return (
      <div className={cn(
        "flex items-center px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-800", 
        className
      )}>
        <AlertCircle className="h-3 w-3 mr-1" />
        <span>Slow Connection</span>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex items-center px-3 py-1 text-xs rounded-full bg-green-100 text-green-800", 
      className
    )}>
      <Wifi className="h-3 w-3 mr-1" />
      <span>Online</span>
    </div>
  );
}
