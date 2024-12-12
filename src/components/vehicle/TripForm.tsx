import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TripLog } from '@/types/vehicle';

interface TripFormProps {
  tripLog: TripLog;
  onTripLogChange: (updates: Partial<TripLog>) => void;
}

export const TripForm = ({ tripLog, onTripLogChange }: TripFormProps) => {
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

      <div className="space-y-2">
        <Input 
          placeholder="Purpose of Trip" 
          value={tripLog.purpose}
          onChange={(e) => onTripLogChange({ purpose: e.target.value })}
        />
        <Textarea 
          placeholder="Additional Comments about the Vehicle" 
          value={tripLog.comment}
          onChange={(e) => onTripLogChange({ comment: e.target.value })}
        />
      </div>
    </div>
  );
};