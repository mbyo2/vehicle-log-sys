import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TripLog } from '@/types/vehicle';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile, useOfflineSync } from '@/hooks/use-mobile';

export function useTripLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { syncOfflineData } = useOfflineSync();
  const [tripLog, setTripLog] = useState<TripLog>({
    vehicleId: '',
    plateNumber: '',
    driver: '',
    driverId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    startKilometers: 0,
    endKilometers: 0,
    purpose: '',
    comment: '',
    totalKilometers: 0,
    timestamp: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);

  useEffect(() => {
    if (navigator.onLine && isOfflineSaved) {
      setIsOfflineSaved(false);
    }
  }, [isOfflineSaved]);

  useEffect(() => {
    const handleOnline = () => {
      if (isOfflineSaved) {
        toast({
          title: "Back Online",
          description: "You're back online. Syncing data...",
        });
        syncOfflineData();
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOfflineSaved, syncOfflineData, toast]);

  const updateTripLog = (updates: Partial<TripLog>) => {
    if (updates.startKilometers && typeof updates.startKilometers === 'string') {
      updates.startKilometers = parseFloat(updates.startKilometers) || 0;
    }
    
    if (updates.endKilometers && typeof updates.endKilometers === 'string') {
      updates.endKilometers = parseFloat(updates.endKilometers) || 0;
    }
    
    setTripLog(prev => {
      const updated = { ...prev, ...updates };
      
      if ('startKilometers' in updates || 'endKilometers' in updates) {
        updated.totalKilometers = (updated.endKilometers || 0) - (updated.startKilometers || 0);
      }
      
      return updated;
    });
  };

  const saveOffline = async (tripData: TripLog) => {
    return new Promise<void>((resolve, reject) => {
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
          const transaction = db.transaction(['tripLogs'], 'readwrite');
          const store = transaction.objectStore('tripLogs');
          
          const entry = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...tripData,
            synced: false,
            createdAt: new Date().toISOString(),
            offlineId: crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}` 
          };
          
          const addRequest = store.add(entry);
          
          addRequest.onsuccess = () => {
            resolve();
          };
          
          addRequest.onerror = (error: any) => {
            reject(error);
          };
        };
        
        request.onerror = (error: any) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  const saveTripLog = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save a vehicle log",
      });
      return;
    }

    if (!tripLog.vehicleId || !tripLog.date || !tripLog.startTime || 
        !tripLog.startKilometers || !tripLog.purpose || !tripLog.driverId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (!navigator.onLine) {
        await saveOffline(tripLog);
        
        toast({
          title: "Saved Offline",
          description: "Trip log saved offline and will sync when online",
        });
        
        setIsOfflineSaved(true);
        
        setTripLog(prev => ({
          ...prev,
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          endKilometers: 0,
          purpose: '',
          comment: '',
          totalKilometers: 0
        }));
        
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('vehicle_logs')
        .insert({
          vehicle_id: tripLog.vehicleId,
          driver_id: tripLog.driverId,
          start_kilometers: tripLog.startKilometers,
          end_kilometers: tripLog.endKilometers || null,
          start_time: new Date(`${tripLog.date}T${tripLog.startTime}`).toISOString(),
          end_time: tripLog.endTime ? new Date(`${tripLog.date}T${tripLog.endTime}`).toISOString() : null,
          purpose: tripLog.purpose,
          comments: tripLog.comment || null,
          approval_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip log saved successfully",
      });

      setTripLog(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        endKilometers: 0,
        purpose: '',
        comment: '',
        totalKilometers: 0
      }));

    } catch (error: any) {
      console.error('Error saving trip log:', error);
      
      if (!navigator.onLine) {
        try {
          await saveOffline(tripLog);
          setIsOfflineSaved(true);
          toast({
            title: "Saved Offline",
            description: "Connection lost. Trip log saved offline and will sync when online.",
          });
        } catch (offlineError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save trip log offline.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not save trip log",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const syncOfflineTripLogs = async () => {
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Cannot sync while offline. Please connect to the internet.",
      });
      return;
    }
    
    try {
      await syncOfflineData();
      
      setIsOfflineSaved(false);
      
    } catch (error) {
      console.error('Error syncing offline trip logs:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Failed to sync offline trip logs. Please try again.",
      });
    }
  };

  return { 
    tripLog, 
    updateTripLog, 
    saveTripLog, 
    isSaving, 
    isOfflineSaved,
    syncOfflineTripLogs
  };
}
