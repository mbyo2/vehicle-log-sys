import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TripLog } from '@/types/vehicle';
import { Card } from '@/components/ui/card';

interface TripFormProps {
  tripLog: TripLog;
  onTripLogChange: (updates: Partial<TripLog>) => void;
  tripPurposes: string[];
}

export const TripForm = ({ tripLog, onTripLogChange, tripPurposes }: TripFormProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurposes = tripPurposes.filter(purpose =>
    purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Input 
          placeholder="Driver Name" 
          value={tripLog.driver}
          onChange={(e) => onTripLogChange({ driver: e.target.value })}
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
            onChange={(e) => onTripLogChange({ endKilometers: Number(e.target.value) })}
          />
          <Input 
            type="time"
            value={tripLog.endTime}
            onChange={(e) => onTripLogChange({ endTime: e.target.value })}
          />
        </div>
      </div>

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