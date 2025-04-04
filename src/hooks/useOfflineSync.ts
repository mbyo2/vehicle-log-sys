
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SyncableOperation {
  id: string;
  table: string;
  type: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingOperations, setPendingOperations] = useState<SyncableOperation[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load of pending operations
    loadPendingOperations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to load pending operations from IndexedDB
  const loadPendingOperations = useCallback(async () => {
    try {
      const request = indexedDB.open('OfflineSyncDB', 1);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = async (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['pendingOperations'], 'readonly');
        const store = transaction.objectStore('pendingOperations');
        
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = (event: any) => {
          const operations = event.target.result || [];
          setPendingOperations(operations);
        };
      };
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  }, []);

  // Add a new operation to be synced
  const addOperation = useCallback((operation: Omit<SyncableOperation, 'id' | 'timestamp'>) => {
    const newOperation: SyncableOperation = {
      ...operation,
      id: crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    // Save to IndexedDB and update state
    try {
      const request = indexedDB.open('OfflineSyncDB', 1);
      
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['pendingOperations'], 'readwrite');
        const store = transaction.objectStore('pendingOperations');
        
        store.add(newOperation);
        
        // Update state
        setPendingOperations(prev => [...prev, newOperation]);
      };
    } catch (error) {
      console.error('Error saving offline operation:', error);
    }
  }, []);

  // Manually trigger sync
  const manualSync = useCallback(async () => {
    if (!isOnline || isSyncing || pendingOperations.length === 0) return;
    
    setIsSyncing(true);
    
    try {
      // Clone the current operations
      const operationsToSync = [...pendingOperations];
      const successfulOperations: string[] = [];
      
      for (const op of operationsToSync) {
        try {
          let result;
          
          switch (op.type) {
            case 'create':
              result = await supabase.from(op.table).insert(op.data);
              break;
            case 'update':
              result = await supabase.from(op.table).update(op.data).eq('id', op.data.id);
              break;
            case 'delete':
              result = await supabase.from(op.table).delete().eq('id', op.data.id);
              break;
          }
          
          if (result && !result.error) {
            successfulOperations.push(op.id);
          } else {
            console.error(`Error syncing operation ${op.id}:`, result?.error);
          }
        } catch (error) {
          console.error(`Error syncing operation ${op.id}:`, error);
        }
      }
      
      // Remove successful operations from IndexedDB and state
      if (successfulOperations.length > 0) {
        const request = indexedDB.open('OfflineSyncDB', 1);
        
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['pendingOperations'], 'readwrite');
          const store = transaction.objectStore('pendingOperations');
          
          successfulOperations.forEach(id => {
            store.delete(id);
          });
          
          // Update state
          setPendingOperations(prev => prev.filter(op => !successfulOperations.includes(op.id)));
        };
      }
      
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, pendingOperations]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        manualSync();
      }, 5000); // Delay to ensure stable connection
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOperations.length, isSyncing, manualSync]);

  return {
    isOnline,
    isSyncing,
    pendingOperations,
    lastSyncTime,
    addOperation,
    manualSync
  };
}
