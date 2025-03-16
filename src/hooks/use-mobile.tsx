
import { useState, useEffect } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileByWidth = width < 768;
      setIsMobile(isMobileByWidth);
    };

    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function useGPSTracking() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return () => {};
    }

    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError("");
      },
      (err) => {
        setError(`Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
    return () => stopTracking();
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return { location, error, isTracking, startTracking, stopTracking };
}

export function useDeviceInfo() {
  const isMobile = useIsMobile();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  useEffect(() => {
    const checkOrientation = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };
    
    checkOrientation();
    
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  return { 
    isMobile, 
    orientation,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isIOS,
    isAndroid
  };
}

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingRecords, setPendingRecords] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  useEffect(() => {
    const checkPendingRecords = async () => {
      try {
        const request = indexedDB.open('TripLogDB', 2);
        
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('tripLogs')) {
            db.createObjectStore('tripLogs', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('tripLogs')) {
            setPendingRecords(0);
            return;
          }
          
          const transaction = db.transaction(['tripLogs'], 'readonly');
          const store = transaction.objectStore('tripLogs');
          const countRequest = store.getAll();
          
          countRequest.onsuccess = () => {
            const records = countRequest.result || [];
            const pendingCount = records.filter((record: any) => !record.synced).length;
            setPendingRecords(pendingCount);
          };
        };
      } catch (error) {
        console.error('Error checking pending records:', error);
      }
    };
    
    // Check for pending records when component mounts
    checkPendingRecords();
    
    // Set up event listeners for online status
    const handleOnline = () => {
      checkPendingRecords();
    };
    
    const handleOffline = () => {
      checkPendingRecords();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check pending records every minute
    const interval = setInterval(checkPendingRecords, 60000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  const syncOfflineData = async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      const request = indexedDB.open('TripLogDB', 2);
      
      request.onsuccess = async (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('tripLogs')) {
          setIsSyncing(false);
          return;
        }
        
        const transaction = db.transaction(['tripLogs'], 'readwrite');
        const store = transaction.objectStore('tripLogs');
        const getRequest = store.getAll();
        
        getRequest.onsuccess = async () => {
          const tripLogs = getRequest.result || [];
          let syncCount = 0;
          
          // Filter only unsynchronized records
          const unsyncedLogs = tripLogs.filter((log: any) => !log.synced);
          
          if (unsyncedLogs.length === 0) {
            setIsSyncing(false);
            return;
          }
          
          // Import supabase client
          const { supabase } = await import('@/integrations/supabase/client');
          
          for (const log of unsyncedLogs) {
            try {
              // Convert the stored offline format to the format expected by Supabase
              const { error } = await supabase
                .from('vehicle_logs')
                .insert({
                  vehicle_id: log.vehicleId,
                  driver_id: log.driverId,
                  start_kilometers: log.startKilometers,
                  end_kilometers: log.endKilometers || null,
                  start_time: new Date(`${log.date}T${log.startTime}`).toISOString(),
                  end_time: log.endTime ? new Date(`${log.date}T${log.endTime}`).toISOString() : null,
                  purpose: log.purpose,
                  comments: log.comment || null,
                  approval_status: 'pending'
                });
              
              if (!error) {
                // Mark as synchronized
                log.synced = true;
                store.put(log);
                syncCount++;
              } else {
                console.error('Error syncing record:', error);
              }
            } catch (error) {
              console.error('Failed to sync log:', error);
            }
          }
          
          setPendingRecords(prevCount => prevCount - syncCount);
          setLastSyncTime(new Date());
          setIsSyncing(false);
          
          // Show notification for successful sync
          if (syncCount > 0 && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Sync Complete', {
              body: `Successfully synchronized ${syncCount} trip records.`
            });
          }
        };
        
        getRequest.onerror = () => {
          console.error('Error retrieving trip logs for sync');
          setIsSyncing(false);
        };
      };
      
      request.onerror = () => {
        console.error('Error opening database for sync');
        setIsSyncing(false);
      };
      
    } catch (error) {
      console.error('Error during sync:', error);
      setIsSyncing(false);
    }
  };
  
  return {
    isSyncing,
    pendingRecords,
    lastSyncTime,
    syncOfflineData,
    isOnline: navigator.onLine
  };
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    setPermission(Notification.permission);
  }, []);
  
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied' as NotificationPermission;
    }
  };
  
  const sendTestNotification = () => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }
    
    try {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from the fleet management app',
        icon: '/favicon.ico',
      });
      
      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };
  
  return {
    permission,
    requestPermission,
    sendTestNotification,
    isSupported: 'Notification' in window
  };
}
