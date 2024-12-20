import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const { toast } = useToast();

  const filteredPurposes = tripPurposes.filter(purpose =>
    purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="font-semibold">Start Point</h4>
          <Input 
            type="number"
            placeholder="Start Kilometers" 
            value={tripLog.startKilometers}
            readOnly
            className="bg-gray-100"
          />
          <Input 
            type="time"
            value={tripLog.startTime}
            onChange={(e) => onTripLogChange({ startTime: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">End Point</h4>
          <Input 
            type="number"
            placeholder="End Kilometers" 
            value={tripLog.endKilometers || ''}
            onChange={(e) => handleEndKilometersChange(Number(e.target.value))}
          />
          <Input 
            type="time"
            value={tripLog.endTime}
            onChange={(e) => onTripLogChange({ endTime: e.target.value })}
          />
        </div>
      </div>

      {tripLog.totalKilometers > 0 && (
        <div className="bg-primary/10 p-4 rounded-md">
          <p className="text-sm font-medium">
            Distance Covered: <span className="text-primary">{tripLog.totalKilometers} km</span>
          </p>
        </div>
      )}

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
        />
      </div>
    </div>
  );
};