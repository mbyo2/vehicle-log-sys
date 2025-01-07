import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface TripFormLocationProps {
  startKilometers: number;
  endKilometers?: number;
  startTime: string;
  endTime: string;
  location?: { latitude: number; longitude: number };
  isTracking: boolean;
  onStartTracking: () => void;
  onEndKilometersChange: (value: number) => void;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
}

export const TripFormLocation = ({
  startKilometers,
  endKilometers,
  startTime,
  endTime,
  location,
  isTracking,
  onStartTracking,
  onEndKilometersChange,
  onTimeChange,
}: TripFormLocationProps) => {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="font-semibold">Start Point</h4>
          <div className="flex gap-2">
            <Input 
              type="number"
              placeholder="Start Kilometers" 
              value={startKilometers}
              readOnly
              className="bg-gray-100"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onStartTracking}
              className={isTracking ? 'bg-green-100' : ''}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
          <Input 
            type="time"
            value={startTime}
            onChange={(e) => onTimeChange('start', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">End Point</h4>
          <Input 
            type="number"
            placeholder="End Kilometers" 
            value={endKilometers || ''}
            onChange={(e) => onEndKilometersChange(Number(e.target.value))}
          />
          <Input 
            type="time"
            value={endTime}
            onChange={(e) => onTimeChange('end', e.target.value)}
          />
        </div>
      </div>

      {location && (
        <Card className="p-4 bg-primary/5">
          <p className="text-sm">
            Current Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </Card>
      )}
    </>
  );
};