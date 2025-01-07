import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGPSTracking, useOfflineSync, useIsMobile } from '@/hooks/use-mobile';
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
  const { isSyncing, syncOfflineData } = useOfflineSync();
  const isMobile = useIsMobile();

  const filteredPurposes = tripPurposes.filter(purpose =>
    purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const fetchDriverId = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('drivers')
          .select('id, man_number')
          .eq('profile_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching driver:', error);
          return;
        }

        if (data) {
          setDriverId(data.id);
          setManNumber(data.man_number);
          onTripLogChange({ driver: data.man_number });
        }
      }
    };

    fetchDriverId();
  }, [user]);

  const handleEndKilometersChange = (value: number) => {
    onTripLogChange({ 
      endKilometers: value,
      totalKilometers: value - tripLog.startKilometers
    });
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    onTripLogChange({ [`${type}Time`]: value });
  };

  return (
    <div className="space-y-4">
      <TripFormHeader 
        isOnline={isOnline}
        isSyncing={isSyncing}
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
        />
        {showSuggestions && searchTerm && (
          <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
            <div className="p-2">
              {filteredPurposes.map((purpose, index) => (
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
              ))}
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
    </div>
  );
};