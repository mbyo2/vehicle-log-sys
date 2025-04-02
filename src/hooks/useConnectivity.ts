
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good'|'poor'|'unknown'>('unknown');
  const { toast } = useToast();

  const checkConnectionSpeed = useCallback(async () => {
    if (!navigator.onLine) {
      setConnectionQuality('unknown');
      return;
    }

    try {
      const startTime = Date.now();
      // Try to fetch a small file to test connection speed
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { 
        cache: 'no-store',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Simple heuristic: < 500ms is good, > 500ms is poor
      const quality = duration < 500 ? 'good' : 'poor';
      setConnectionQuality(quality);
      
      return quality;
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionQuality('unknown');
      return 'unknown';
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: "Connected to the network"
      });
      checkConnectionSpeed();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('unknown');
      toast({
        variant: "destructive",
        title: "You're offline",
        description: "Working in offline mode"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    checkConnectionSpeed();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectionSpeed, toast]);

  return {
    isOnline,
    connectionQuality,
    checkConnectionSpeed
  };
}
