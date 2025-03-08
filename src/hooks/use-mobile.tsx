
import { useState, useEffect } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if the device is mobile by screen width or user agent
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileByWidth = width < 768;
      const isMobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileByWidth || isMobileByUserAgent);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
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

// New hook for device info
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
  
  return { 
    isMobile, 
    orientation,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    isAndroid: /Android/.test(navigator.userAgent)
  };
}

// New hook for offline sync
export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingRecords, setPendingRecords] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Check for pending records in IndexedDB
  useEffect(() => {
    const checkPendingRecords = async () => {
      try {
        const request = indexedDB.open('TripLogDB', 2);
        
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('tripLogs')) {
            setPendingRecords(0);
            return;
          }
          
          const transaction = db.transaction(['tripLogs'], 'readonly');
          const store = transaction.objectStore('tripLogs');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            setPendingRecords(countRequest.result);
          };
        };
      } catch (error) {
        console.error('Error checking pending records:', error);
      }
    };
    
    checkPendingRecords();
    
    // Also check when the app comes back online
    const handleOnline = () => {
      checkPendingRecords();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  const syncOfflineData = async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      // Open the database
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
          const tripLogs = getRequest.result;
          let syncCount = 0;
          
          for (const log of tripLogs) {
            if (log.synced) continue;
            
            try {
              // Attempt to sync with the server
              const response = await fetch('/api/trip-logs', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(log)
              });
              
              if (response.ok) {
                // Mark as synced in IndexedDB
                log.synced = true;
                store.put(log);
                syncCount++;
              }
            } catch (error) {
              console.error('Failed to sync log:', error);
            }
          }
          
          // Update pending records count
          setPendingRecords(prevCount => prevCount - syncCount);
          setLastSyncTime(new Date());
          setIsSyncing(false);
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

// New hook for push notifications
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
