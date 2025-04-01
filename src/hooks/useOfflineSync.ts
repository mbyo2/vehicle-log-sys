
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
        if (!db.objectStoreNames.contains('tripLogs')) {
          db.createObjectStore('tripLogs', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
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
    if (!user) {
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
    
    setIsSyncing(true);
    
    try {
      const request = indexedDB.open('OfflineData', 1);
      
      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['tripLogs'], 'readonly');
        const store = transaction.objectStore('tripLogs');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = async () => {
          const offlineData = getAllRequest.result;
          let syncCount = 0;
          
          for (const item of offlineData) {
            try {
              const { error } = await supabase
                .from('trip_logs')
                .insert(item);
              
              if (!error) {
                syncCount++;
                // Remove from IndexedDB after successful sync
                const deleteTransaction = db.transaction(['tripLogs'], 'readwrite');
                const deleteStore = deleteTransaction.objectStore('tripLogs');
                deleteStore.delete(item.id);
              }
            } catch (error) {
              console.error('Error syncing record:', error);
            }
          }
          
          toast({
            title: "Sync Complete",
            description: `Successfully synchronized ${syncCount} records`
          });
          
          // Update pending count
          checkPendingRecords();
        };
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
