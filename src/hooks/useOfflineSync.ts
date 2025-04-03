
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ToastAction } from "@/components/ui/toast";

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingRecords, setPendingRecords] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check for pending records in IndexedDB
  const checkPendingRecords = useCallback(async () => {
    try {
      const request = indexedDB.open('OfflineData', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create all needed stores for offline data
        ['tripLogs', 'maintenance', 'documents', 'vehicleInspections'].forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        let totalCount = 0;
        const transaction = db.transaction(db.objectStoreNames, 'readonly');
        
        Array.from(db.objectStoreNames).forEach(storeName => {
          const store = transaction.objectStore(storeName);
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            totalCount += countRequest.result;
            setPendingRecords(totalCount);
          };
        });
      };
      
      request.onerror = () => {
        console.error('Error opening IndexedDB');
        setPendingRecords(0);
      };
    } catch (error) {
      console.error('Error checking pending records:', error);
      setPendingRecords(0);
    }
  }, []);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync offline data to Supabase
  const syncOfflineData = useCallback(async () => {
    const currentUser = user.get();
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sync your offline data",
        variant: "destructive"
      });
      return;
    }
    
    if (pendingRecords === 0) {
      toast({
        title: "No data to sync",
        description: "All data is already synchronized"
      });
      return;
    }
    
    if (!navigator.onLine) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline",
        variant: "destructive"
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const request = indexedDB.open('OfflineData', 1);
      
      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        let syncCount = 0;
        let tables: { [key: string]: string } = {
          'tripLogs': 'trip_logs',
          'maintenance': 'vehicle_services',
          'documents': 'documents',
          'vehicleInspections': 'vehicle_inspections'
        };
        
        // Process each store
        for (const [storeName, tableName] of Object.entries(tables)) {
          if (db.objectStoreNames.contains(storeName)) {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            await new Promise<void>((resolve) => {
              getAllRequest.onsuccess = async () => {
                const items = getAllRequest.result;
                
                for (const item of items) {
                  try {
                    const { error } = await supabase
                      .from(tableName)
                      .insert(item);
                    
                    if (!error) {
                      syncCount++;
                      store.delete(item.id);
                    } else {
                      console.error(`Error syncing ${tableName}:`, error);
                    }
                  } catch (error) {
                    console.error(`Error syncing ${tableName}:`, error);
                  }
                }
                
                resolve();
              };
              
              getAllRequest.onerror = () => {
                console.error(`Failed to get data from ${storeName}`);
                resolve();
              };
            });
          }
        }
        
        if (syncCount > 0) {
          toast({
            title: "Sync Complete",
            description: `Successfully synchronized ${syncCount} records`
          });
        } else {
          toast({
            title: "Sync Attempted",
            description: "No records could be synchronized",
            variant: "destructive"
          });
        }
        
        // Update pending count
        checkPendingRecords();
      };
      
      request.onerror = () => {
        toast({
          title: "Sync Failed",
          description: "Could not access offline data",
          variant: "destructive"
        });
      };
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize offline data",
        variant: "destructive"
      });
      console.error('Error in syncOfflineData:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [checkPendingRecords, pendingRecords, toast, user]);

  // Check for pending records on component mount and when online status changes
  useEffect(() => {
    checkPendingRecords();
    
    const handleOnline = () => {
      checkPendingRecords();
      if (pendingRecords > 0) {
        toast({
          title: "You're back online",
          description: `${pendingRecords} records ready to sync`,
          action: (
            <ToastAction altText="Sync Now" onClick={syncOfflineData}>
              Sync Now
            </ToastAction>
          )
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [checkPendingRecords, pendingRecords, syncOfflineData, toast]);

  return {
    isSyncing,
    pendingRecords,
    isOnline,
    syncOfflineData,
    checkPendingRecords
  };
}
