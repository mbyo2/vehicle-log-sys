
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
          <h4 className="font-semibold flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> Start Point
            {isTracking && (
              <Badge variant="outline" className="ml-2 bg-green-50 border-green-200 text-green-700">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Tracking
              </Badge>
            )}
          </h4>
          <div className="flex gap-2">
            <Input 
              type="number"
              placeholder="Start Kilometers" 
              value={startKilometers}
              readOnly
              className="bg-gray-100"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onStartTracking}
                    className={isTracking ? 'bg-green-100 text-green-700 border-green-300' : ''}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isTracking ? 'GPS tracking active' : 'Start GPS tracking'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input 
              type="time"
              value={startTime}
              onChange={(e) => onTimeChange('start', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> End Point
          </h4>
          <Input 
            type="number"
            placeholder="End Kilometers" 
            value={endKilometers || ''}
            onChange={(e) => onEndKilometersChange(Number(e.target.value))}
          />
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input 
              type="time"
              value={endTime}
              onChange={(e) => onTimeChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>

      {location && (
        <Card className="p-4 bg-primary/5 border border-primary/20">
          <div className="flex items-center space-x-2">
            <Navigation className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Current GPS Location</p>
              <p className="text-xs text-muted-foreground">
                Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
