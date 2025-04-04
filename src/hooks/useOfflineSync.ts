
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncableOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  condition?: Record<string, any>;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<SyncableOperation[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(
    parseInt(localStorage.getItem('lastSyncTime') || '0', 10)
  );
  const { toast } = useToast();
  
  // Track online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: "Changes will now be synchronized with the server.",
      });
      syncWithServer();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "You're offline",
        description: "Changes will be saved locally and synchronized when you're back online.",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load pending operations from localStorage on mount
    const savedOperations = localStorage.getItem('pendingOperations');
    if (savedOperations) {
      setPendingOperations(JSON.parse(savedOperations));
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);
  
  // Function to add a new operation to the queue
  const addOperation = (operation: Omit<SyncableOperation, 'id' | 'timestamp'>) => {
    const newOperation: SyncableOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    setPendingOperations(prev => [...prev, newOperation]);
    
    // If online, attempt to sync immediately
    if (isOnline) {
      syncWithServer();
    }
  };
  
  // Function to sync pending operations with the server
  const syncWithServer = async () => {
    if (!isOnline || isSyncing || pendingOperations.length === 0) {
      return;
    }
    
    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;
    
    // Clone the operations to work with
    const operations = [...pendingOperations];
    const completedOperationIds: string[] = [];
    
    try {
      // Process operations in the order they were created
      for (const operation of operations) {
        try {
          switch (operation.operation) {
            case 'insert':
              await supabase.from(operation.table).insert(operation.data);
              break;
            case 'update':
              if (operation.condition) {
                const query = supabase.from(operation.table).update(operation.data);
                // Apply conditions
                Object.entries(operation.condition).forEach(([key, value]) => {
                  query.eq(key, value);
                });
                await query;
              } else {
                await supabase.from(operation.table).update(operation.data).eq('id', operation.data.id);
              }
              break;
            case 'delete':
              if (operation.condition) {
                const query = supabase.from(operation.table).delete();
                // Apply conditions
                Object.entries(operation.condition).forEach(([key, value]) => {
                  query.eq(key, value);
                });
                await query;
              } else {
                await supabase.from(operation.table).delete().eq('id', operation.data.id);
              }
              break;
          }
          
          // Mark as completed
          completedOperationIds.push(operation.id);
          successCount++;
        } catch (error) {
          console.error(`Error processing operation ${operation.id}:`, error);
          failCount++;
          // We continue processing other operations even if one fails
        }
      }
      
      // Remove completed operations
      if (completedOperationIds.length > 0) {
        setPendingOperations(prev => 
          prev.filter(op => !completedOperationIds.includes(op.id))
        );
      }
      
      // Update last sync time
      const now = Date.now();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now.toString());
      
      // Show toast based on results
      if (successCount > 0) {
        toast({
          title: "Sync completed",
          description: `Successfully synchronized ${successCount} operation${successCount !== 1 ? 's' : ''}.${
            failCount > 0 ? ` Failed to sync ${failCount} operation${failCount !== 1 ? 's' : ''}.` : ''
          }`,
        });
      } else if (failCount > 0) {
        toast({
          variant: "destructive",
          title: "Sync failed",
          description: `Failed to synchronize ${failCount} operation${failCount !== 1 ? 's' : ''}.`,
        });
      }
    } catch (error) {
      console.error("Error during sync process:", error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "An error occurred while synchronizing with the server.",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Manually trigger a sync
  const manualSync = () => {
    if (isOnline && !isSyncing) {
      syncWithServer();
    } else if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Cannot sync",
        description: "You are currently offline. Please connect to the internet and try again.",
      });
    }
  };
  
  return {
    isOnline,
    isSyncing,
    pendingOperations,
    lastSyncTime,
    addOperation,
    manualSync,
  };
}
