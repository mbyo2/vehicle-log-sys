
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TripLog } from '@/types/vehicle';

export function useTripLog(vehicleId?: string) {
  const [tripLog, setTripLog] = useState<TripLog>({
    vehicle_id: vehicleId || '',
    driver_id: '',
    date: new Date().toISOString().split('T')[0],
    startKilometers: 0,
    endKilometers: 0,
    totalKilometers: 0,
    startTime: '',
    endTime: '',
    purpose: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tripPurposes, setTripPurposes] = useState<string[]>([
    'Business Meeting',
    'Client Visit',
    'Site Inspection',
    'Material Transport',
    'Team Transport',
    'Training',
    'Service Delivery',
    'Administrative',
    'Other'
  ]);

  useEffect(() => {
    // Load vehicle's current odometer reading if vehicle ID is provided
    if (vehicleId) {
      loadVehicleData();
    }

    // Monitor online/offline status
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [vehicleId]);

  const loadVehicleData = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('current_kilometers')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;

      if (data) {
        setTripLog(prev => ({
          ...prev,
          vehicle_id: vehicleId || '',
          startKilometers: data.current_kilometers || 0
        }));
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      // If offline, try to get from IndexedDB
      if (!navigator.onLine) {
        loadFromIndexedDB();
      }
    }
  };

  const loadFromIndexedDB = async () => {
    try {
      const dbRequest = indexedDB.open('VehicleCache', 1);
      
      dbRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('vehicles')) {
          db.createObjectStore('vehicles', { keyPath: 'id' });
        }
      };
      
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains('vehicles')) {
          const transaction = db.transaction(['vehicles'], 'readonly');
          const store = transaction.objectStore('vehicles');
          const request = store.get(vehicleId);
          
          request.onsuccess = () => {
            if (request.result) {
              setTripLog(prev => ({
                ...prev,
                startKilometers: request.result.current_kilometers || 0
              }));
            }
          };
        }
      };
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
    }
  };

  const handleTripLogChange = (updates: Partial<TripLog>) => {
    setTripLog(prev => ({ ...prev, ...updates }));
  };

  const saveToIndexedDB = async (newTripLog: TripLog) => {
    const tripId = crypto.randomUUID();
    const currentTime = new Date().toISOString();
    
    try {
      const dbRequest = indexedDB.open('OfflineData', 1);
      
      dbRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('tripLogs')) {
          db.createObjectStore('tripLogs', { keyPath: 'id' });
        }
      };
      
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['tripLogs'], 'readwrite');
        const store = transaction.objectStore('tripLogs');
        
        // Format the data for Supabase
        const tripData = {
          id: tripId,
          vehicle_id: newTripLog.vehicle_id,
          driver_id: newTripLog.driver_id,
          start_kilometers: newTripLog.startKilometers,
          end_kilometers: newTripLog.endKilometers,
          start_time: `${newTripLog.date}T${newTripLog.startTime}:00`,
          end_time: `${newTripLog.date}T${newTripLog.endTime}:00`,
          purpose: newTripLog.purpose,
          comments: newTripLog.comment,
          start_location: newTripLog.start_location,
          end_location: newTripLog.end_location,
          approval_status: 'pending',
          created_at: currentTime,
          updated_at: currentTime
        };
        
        store.add(tripData);
        
        // Also update the cached vehicle kilometers
        if (db.objectStoreNames.contains('vehicles') && vehicleId && newTripLog.endKilometers) {
          const vehicleTransaction = db.transaction(['vehicles'], 'readwrite');
          const vehicleStore = vehicleTransaction.objectStore('vehicles');
          const request = vehicleStore.get(vehicleId);
          
          request.onsuccess = () => {
            const vehicle = request.result || { id: vehicleId };
            vehicle.current_kilometers = newTripLog.endKilometers;
            vehicle.updated_at = currentTime;
            vehicleStore.put(vehicle);
          };
        }
      };
      
      return { id: tripId, success: true };
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
      return { id: null, success: false };
    }
  };

  const submitTripLog = async () => {
    // Validate form data
    if (!tripLog.vehicle_id) {
      toast({
        variant: "destructive",
        title: "Missing Vehicle",
        description: "No vehicle selected for this trip log"
      });
      return;
    }
    
    if (!tripLog.startTime || !tripLog.endTime) {
      toast({
        variant: "destructive",
        title: "Missing Time Information",
        description: "Please enter both start and end times"
      });
      return;
    }
    
    if (!tripLog.purpose) {
      toast({
        variant: "destructive",
        title: "Missing Purpose",
        description: "Please enter the purpose of the trip"
      });
      return;
    }
    
    if (!tripLog.endKilometers || tripLog.endKilometers <= tripLog.startKilometers) {
      toast({
        variant: "destructive",
        title: "Invalid Kilometers",
        description: "End kilometers must be greater than start kilometers"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If offline, save to IndexedDB for later sync
      if (!isOnline) {
        const { id, success } = await saveToIndexedDB(tripLog);
        
        if (success) {
          toast({
            title: "Saved Offline",
            description: "Trip log saved locally and will sync when you're online"
          });
          
          // Reset form
          setTripLog({
            vehicle_id: vehicleId || '',
            driver_id: tripLog.driver_id,
            startKilometers: tripLog.endKilometers,
            endKilometers: 0,
            totalKilometers: 0,
            startTime: '',
            endTime: '',
            purpose: '',
            date: new Date().toISOString().split('T')[0],
            comment: ''
          });
          
          return;
        } else {
          throw new Error("Failed to save offline");
        }
      }
      
      // Format data for Supabase
      const tripData = {
        vehicle_id: tripLog.vehicle_id,
        driver_id: tripLog.driver_id,
        start_kilometers: tripLog.startKilometers,
        end_kilometers: tripLog.endKilometers,
        start_time: `${tripLog.date}T${tripLog.startTime}:00`,
        end_time: `${tripLog.date}T${tripLog.endTime}:00`,
        purpose: tripLog.purpose,
        comments: tripLog.comment,
        start_location: tripLog.start_location,
        end_location: tripLog.end_location,
        approval_status: 'pending'
      };
      
      // If it's an update
      if (tripLog.id) {
        const { error } = await supabase
          .from('trip_logs')
          .update(tripData)
          .eq('id', tripLog.id);
          
        if (error) throw error;
        
        toast({
          title: "Trip Log Updated",
          description: "Your trip log has been updated successfully"
        });
      } else {
        // If it's a new entry
        const { data, error } = await supabase
          .from('trip_logs')
          .insert(tripData)
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Trip Log Submitted",
          description: "Your trip log has been submitted successfully"
        });
        
        // Reset form with new start kilometers
        setTripLog({
          vehicle_id: vehicleId || '',
          driver_id: tripLog.driver_id,
          startKilometers: tripLog.endKilometers,
          endKilometers: 0,
          totalKilometers: 0,
          startTime: '',
          endTime: '',
          purpose: '',
          date: new Date().toISOString().split('T')[0],
          comment: ''
        });
      }
    } catch (error: any) {
      console.error('Error submitting trip log:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit trip log"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    tripLog,
    isSubmitting,
    isOnline,
    tripPurposes,
    handleTripLogChange,
    submitTripLog
  };
}
