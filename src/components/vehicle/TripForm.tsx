import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TripLog } from '@/types/vehicle';
import { Card } from '@/components/ui/card';

// Mock database of drivers and their man numbers
const driverDatabase = {
  'John Doe': 'MN001',
  'Jane Smith': 'MN002',
  'Mike Johnson': 'MN003',
  // Add more drivers as needed
};

// Reverse lookup for man numbers to names
const manNumberDatabase = Object.entries(driverDatabase).reduce((acc, [name, num]) => {
  acc[num] = name;
  return acc;
}, {} as Record<string, string>);

interface TripFormProps {
  tripLog: TripLog;
  onTripLogChange: (updates: Partial<TripLog>) => void;
  tripPurposes: string[];
}

export const TripForm = ({ tripLog, onTripLogChange, tripPurposes }: TripFormProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manNumber, setManNumber] = useState('');

  const filteredPurposes = tripPurposes.filter(purpose =>
    purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Effect to handle driver name changes
  useEffect(() => {
    if (tripLog.driver && driverDatabase[tripLog.driver]) {
      setManNumber(driverDatabase[tripLog.driver]);
    }
  }, [tripLog.driver]);

  const handleDriverChange = (value: string) => {
    onTripLogChange({ driver: value });
    // Check if the entered name exists in the database
    if (driverDatabase[value]) {
      setManNumber(driverDatabase[value]);
    }
  };

  const handleManNumberChange = (value: string) => {
    setManNumber(value);
    // Check if the entered man number exists in the database
    if (manNumberDatabase[value]) {
      onTripLogChange({ driver: manNumberDatabase[value] });
    }
  };

  const handleEndKilometersChange = (value: number) => {
    onTripLogChange({ 
      endKilometers: value,
      totalKilometers: value - tripLog.startKilometers
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Driver Name" 
            value={tripLog.driver}
            onChange={(e) => handleDriverChange(e.target.value)}
          />
          <Input 
            placeholder="Man Number"
            value={manNumber}
            onChange={(e) => handleManNumberChange(e.target.value)}
            className="w-32"
          />
        </div>
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