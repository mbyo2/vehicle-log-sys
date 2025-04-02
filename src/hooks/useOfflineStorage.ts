
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useOfflineStorage<T extends { id?: string }>(tableName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const dbName = 'OfflineData';
  const storeName = tableName;

  const initDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(new Error('Failed to open database'));
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
    });
  }, [storeName]);

  const saveItem = useCallback(async (item: T): Promise<T> => {
    setIsLoading(true);
    const isOnline = navigator.onLine;
    const userProfile = profile.get();
    
    try {
      // Ensure item has ID and company_id
      const itemToSave = {
        ...item,
        id: item.id || uuidv4(),
        company_id: userProfile?.company_id,
        updated_at: new Date().toISOString(),
        created_locally: !isOnline
      };
      
      // Try to save to Supabase if online
      if (isOnline) {
        try {
          const { error } = await supabase
            .from(tableName)
            .insert(itemToSave);
            
          if (!error) {
            toast({
              title: "Data Saved",
              description: "Successfully saved to server"
            });
            setIsLoading(false);
            return itemToSave;
          }
        } catch (error) {
          console.error('Supabase save error:', error);
        }
      }
      
      // Save to IndexedDB (either as fallback or primary if offline)
      const db = await initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(itemToSave);
        
        request.onsuccess = () => {
          toast({
            title: isOnline ? "Fallback Storage" : "Offline Storage",
            description: isOnline ? 
              "Saved locally due to server issues" : 
              "Saved locally while offline"
          });
          resolve(itemToSave);
        };
        
        request.onerror = () => {
          reject(new Error('Failed to save item to local storage'));
        };
        
        tx.oncomplete = () => {
          db.close();
          setIsLoading(false);
        };
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save data"
      });
      setIsLoading(false);
      throw error;
    }
  }, [initDB, profile, tableName, toast]);

  const getItems = useCallback(async (): Promise<T[]> => {
    setIsLoading(true);
    
    try {
      const items: T[] = [];
      
      // Try to get from Supabase first if online
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
            
          if (!error && data) {
            setIsLoading(false);
            return data as T[];
          }
        } catch (error) {
          console.error('Supabase fetch error:', error);
        }
      }
      
      // Get from IndexedDB (as fallback or primary if offline)
      const db = await initDB();
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result as T[]);
        };
        
        request.onerror = () => {
          reject(new Error('Failed to get items from local storage'));
        };
        
        tx.oncomplete = () => {
          db.close();
          setIsLoading(false);
        };
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Load Error",
        description: "Failed to load data"
      });
      setIsLoading(false);
      throw error;
    }
  }, [initDB, tableName, toast]);

  return {
    saveItem,
    getItems,
    isLoading
  };
}
