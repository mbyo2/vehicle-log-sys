
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGPSTracking, useOfflineSync, useDeviceInfo } from '@/hooks/use-mobile';
import { TripFormHeader } from './TripFormHeader';
import { TripFormLocation } from './TripFormLocation';
import { TripFormStatus } from './TripFormStatus';

interface TripFormProps {
  tripLog: any;
  onTripLogChange: (updates: Partial<any>) => void;
  tripPurposes: string[];
}

export const TripForm = ({ tripLog, onTripLogChange, tripPurposes }: TripFormProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manNumber, setManNumber] = useState('');
  const [driverId, setDriverId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth();
  const { toast } = useToast();
  const { location, isTracking, startTracking } = useGPSTracking();
  const { isSyncing, pendingRecords, syncOfflineData } = useOfflineSync();
  const { isMobile, orientation } = useDeviceInfo();

  const filteredPurposes = tripPurposes.filter(purpose =>
    purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Monitor online/offline status
  useEffect(() => {
    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online && pendingRecords > 0) {
        toast({
          title: "Back Online",
          description: `You're back online. ${pendingRecords} trip logs ready to sync.`,
        });
      } else if (!online) {
        toast({
          variant: "destructive", // Fixed: Changed from "warning" to "destructive"
          title: "Offline Mode",
          description: "You're now working offline. Changes will be saved locally.",
        });
      }
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [pendingRecords, toast]);

  // Load driver details from Supabase when user is available
  useEffect(() => {
    const fetchDriverId = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('drivers')
            .select('id, man_number')
            .eq('profile_id', user.id)
            .single();

          if (error) {
            console.error('Error fetching driver:', error);
            // If we're offline, try to load from indexedDB
            if (!navigator.onLine) {
              loadDriverFromIndexedDB();
            }
            return;
          }

          if (data) {
            setDriverId(data.id);
            setManNumber(data.man_number);
            onTripLogChange({ driver: data.man_number, driverId: data.id });
            
            // Save to IndexedDB for offline use
            saveDriverToIndexedDB(data);
          }
        } catch (error) {
          console.error('Error in fetchDriverId:', error);
          // If fetch fails, try to load from indexedDB
          loadDriverFromIndexedDB();
        }
      }
    };

    const saveDriverToIndexedDB = async (driverData: any) => {
      try {
        const request = indexedDB.open('DriverCache', 1);
        
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('drivers')) {
            db.createObjectStore('drivers', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['drivers'], 'readwrite');
          const store = transaction.objectStore('drivers');
          
          store.put({
            ...driverData,
            cachedAt: new Date().toISOString()
          });
        };
      } catch (error) {
        console.error('Error saving driver to IndexedDB:', error);
      }
    };

    const loadDriverFromIndexedDB = async () => {
      try {
        if (!user) return;
        
        const request = indexedDB.open('DriverCache', 1);
        
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains('drivers')) {
            console.log('No drivers store found in IndexedDB');
            return;
          }
          
          const transaction = db.transaction(['drivers'], 'readonly');
          const store = transaction.objectStore('drivers');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const drivers = getAllRequest.result;
            if (drivers && drivers.length > 0) {
              // Just use the first driver for now - in a real app we'd match by profile_id
              const driver = drivers[0];
              setDriverId(driver.id);
              setManNumber(driver.man_number);
              onTripLogChange({ driver: driver.man_number, driverId: driver.id });
            }
          };
        };
      } catch (error) {
        console.error('Error loading driver from IndexedDB:', error);
      }
    };

    fetchDriverId();
  }, [user, onTripLogChange]);

  // Auto-start GPS tracking on mobile
  useEffect(() => {
    if (isMobile && !isTracking && isOnline) {
      startTracking();
    }
  }, [isMobile, isTracking, isOnline, startTracking]);

  const handleEndKilometersChange = (value: number) => {
    onTripLogChange({ 
      endKilometers: value,
      totalKilometers: value - tripLog.startKilometers
    });
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    onTripLogChange({ [`${type}Time`]: value });
  };

  // Handle form submit with offline support
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission handling is in useTripLog hook
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TripFormHeader 
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingRecords={pendingRecords}
        syncOfflineData={syncOfflineData}
      />

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
        <Input 
          placeholder="Man Number" 
          value={manNumber}
          readOnly
          className="bg-gray-100"
        />
        <Input 
          type="date"
          value={tripLog.date}
          onChange={(e) => onTripLogChange({ date: e.target.value })}
          required
        />
      </div>

      <TripFormLocation 
        startKilometers={tripLog.startKilometers}
        endKilometers={tripLog.endKilometers}
        startTime={tripLog.startTime}
        endTime={tripLog.endTime}
        location={location}
        isTracking={isTracking}
        onStartTracking={startTracking}
        onEndKilometersChange={handleEndKilometersChange}
        onTimeChange={handleTimeChange}
      />

      <TripFormStatus 
        approvalStatus={tripLog.approval_status || 'pending'}
        approvalComment={tripLog.approval_comment}
        totalKilometers={tripLog.totalKilometers}
      />

      <div className="space-y-2 relative">
        <Input 
          placeholder="Purpose of Trip" 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
            onTripLogChange({ purpose: e.target.value });
          }}
          onFocus={() => setShowSuggestions(true)}
          required
        />
        {showSuggestions && searchTerm && (
          <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
            <div className="p-2">
              {filteredPurposes.length > 0 ? (
                filteredPurposes.map((purpose, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setSearchTerm(purpose);
                      onTripLogChange({ purpose });
                      setShowSuggestions(false);
                    }}
                  >
                    {purpose}
                  </div>
                ))
              ) : (
                <div className="p-2 text-muted-foreground">No matches found</div>
              )}
            </div>
          </Card>
        )}
        <Textarea 
          placeholder="Additional Comments about the Vehicle" 
          value={tripLog.comment}
          onChange={(e) => onTripLogChange({ comment: e.target.value })}
          className="min-h-[100px]"
        />
      </div>
    </form>
  );
};
