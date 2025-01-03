import * as React from "react";
import { useToast } from "@/components/ui/use-toast";

const MOBILE_BREAKPOINT = 768;

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
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

  const syncOfflineData = React.useCallback(async () => {
    if (!navigator.onLine) {
      toast({
        variant: "warning",
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
        const unsyncedData = await store.getAll();

        // Sync data with Supabase
        for (const data of unsyncedData) {
          if (!data.synced) {
            // Update sync status
            data.synced = true;
            store.put(data);
          }
        }

        toast({
          title: "Sync Complete",
          description: "All offline data has been synchronized",
        });
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
  }, [toast]);

  React.useEffect(() => {
    const handleOnline = () => {
      syncOfflineData();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineData]);

  return { isSyncing, syncOfflineData };
}