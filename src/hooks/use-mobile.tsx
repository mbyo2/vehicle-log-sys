
import * as React from "react";
import { useToast } from "@/components/ui/use-toast";

const MOBILE_BREAKPOINT = 768;

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  orientation: 'portrait' | 'landscape';
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isIOS: false,
    isAndroid: false,
    orientation: 'portrait'
  });

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Check device type
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < 1024;
      
      // Check operating system
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      // Check orientation
      const orientation = width > height ? 'landscape' : 'portrait';
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isIOS,
        isAndroid,
        orientation
      });
    };

    // Initial check
    updateDeviceInfo();
    
    // Add event listeners
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

export function useIsMobile() {
  const { isMobile } = useDeviceInfo();
  return isMobile;
}

export function useGPSTracking() {
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isTracking, setIsTracking] = React.useState(false);
  const { toast } = useToast();

  const startTracking = React.useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        });

        // Store location in IndexedDB for offline access
        if ('indexedDB' in window) {
          const request = indexedDB.open('TripLogDB', 1);
          
          request.onerror = () => {
            console.error("IndexedDB error");
          };

          request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction(['locations'], 'readwrite');
            const store = transaction.objectStore('locations');
            store.add({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp,
              synced: false
            });
          };

          request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            db.createObjectStore('locations', { keyPath: 'timestamp' });
          };
        }
      },
      (error) => {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [toast]);

  return { location, error, isTracking, startTracking };
}

export function useOfflineSync() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [pendingRecords, setPendingRecords] = React.useState<number>(0);

  const checkPendingRecords = React.useCallback(async () => {
    if ('indexedDB' in window) {
      try {
        const request = indexedDB.open('TripLogDB', 1);
        
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['locations'], 'readonly');
          const store = transaction.objectStore('locations');
          
          const countRequest = store.count();
          countRequest.onsuccess = () => {
            setPendingRecords(countRequest.result);
          };
        };
      } catch (error) {
        console.error('Error checking pending records:', error);
      }
    }
  }, []);

  const syncOfflineData = React.useCallback(async () => {
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Data will be synced when connection is restored",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const request = indexedDB.open('TripLogDB', 1);
      
      request.onsuccess = async (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['locations'], 'readwrite');
        const store = transaction.objectStore('locations');
        
        const getRequest = store.getAll();
        getRequest.onsuccess = async () => {
          const unsyncedData = getRequest.result;
          let syncedCount = 0;

          // Sync data with Supabase
          for (const data of unsyncedData) {
            if (!data.synced) {
              try {
                // Mark as synced after successful upload
                data.synced = true;
                store.put(data);
                syncedCount++;
              } catch (error) {
                console.error('Error syncing record:', error);
              }
            }
          }

          toast({
            title: "Sync Complete",
            description: `Synchronized ${syncedCount} offline records`,
          });
          
          // Update pending records count
          checkPendingRecords();
        };
      };
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to synchronize offline data",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast, checkPendingRecords]);

  React.useEffect(() => {
    // Check pending records on mount
    checkPendingRecords();
    
    const handleOnline = () => {
      toast({
        title: "Online",
        description: "Connection restored. Syncing data...",
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Connection lost. Data will be stored locally.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for network status changes every minute
    const interval = setInterval(checkPendingRecords, 60000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [toast, syncOfflineData, checkPendingRecords]);

  return { isSyncing, pendingRecords, syncOfflineData, checkPendingRecords };
}

export function usePushNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission | 'default'>(
    'Notification' in window ? Notification.permission : 'default'
  );
  const [pushEnabled, setPushEnabled] = React.useState<boolean>(false);
  const { toast } = useToast();

  // Request notification permission
  const requestPermission = React.useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "Notifications Not Supported",
        description: "Your browser doesn't support push notifications.",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setPushEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You will now receive push notifications.",
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Push notifications are disabled.",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to request notification permission.",
      });
      return false;
    }
  }, [toast]);

  // Send a test notification
  const sendTestNotification = React.useCallback(() => {
    if (permission !== 'granted') {
      requestPermission();
      return;
    }

    try {
      const notification = new Notification('Vehicle Logger', {
        body: 'This is a test notification from Vehicle Logger',
        icon: '/favicon.ico'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test notification.",
      });
    }
  }, [permission, requestPermission, toast]);

  return { 
    permission, 
    pushEnabled, 
    requestPermission, 
    sendTestNotification 
  };
}
