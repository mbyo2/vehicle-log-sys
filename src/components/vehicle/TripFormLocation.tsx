
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface TripFormLocationProps {
  startKilometers: number;
  endKilometers: number;
  startTime: string;
  endTime: string;
  location: { latitude: number; longitude: number } | null;
  isTracking: boolean;
  onStartTracking: () => void;
  onEndKilometersChange: (value: number) => void;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  onStartKilometersChange?: (value: number) => void;
}

export const TripFormLocation: React.FC<TripFormLocationProps> = ({
  startKilometers,
  endKilometers,
  startTime,
  endTime,
  location,
  isTracking,
  onStartTracking,
  onEndKilometersChange,
  onTimeChange,
  onStartKilometersChange
}) => {
  const handleStartKilometersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (onStartKilometersChange) {
      onStartKilometersChange(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Time</label>
          <div className="flex">
            <Input 
              type="time"
              value={startTime}
              onChange={(e) => onTimeChange('start', e.target.value)}
              required
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">End Time</label>
          <div className="flex">
            <Input 
              type="time"
              value={endTime}
              onChange={(e) => onTimeChange('end', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Odometer (km)</label>
          <Input 
            type="number"
            min="0"
            value={startKilometers}
            onChange={handleStartKilometersChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">End Odometer (km)</label>
          <Input 
            type="number"
            min={startKilometers}
            value={endKilometers || ''}
            onChange={(e) => onEndKilometersChange(parseInt(e.target.value))}
            placeholder="Enter ending kilometers"
          />
        </div>
      </div>
      
      {location && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <MapPin className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">Current location detected</span>
            </div>
            <div className="text-xs text-blue-600">
              Latitude: {location.latitude.toFixed(6)}, 
              Longitude: {location.longitude.toFixed(6)}
            </div>
          </CardContent>
        </Card>
      )}
      
      {!location && !isTracking && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onStartTracking}
          className="flex gap-2 items-center w-full border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <MapPin className="h-4 w-4" />
          <span>Use my current location</span>
        </Button>
      )}
    </div>
  );
};
