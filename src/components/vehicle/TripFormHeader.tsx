import { Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripFormHeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  syncOfflineData: () => void;
}

export const TripFormHeader = ({ isOnline, isSyncing, syncOfflineData }: TripFormHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Trip Log</h2>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-5 w-5 text-green-500" />
        ) : (
          <WifiOff className="h-5 w-5 text-yellow-500" />
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={syncOfflineData}
          disabled={isSyncing || isOnline}
        >
          Sync Data
        </Button>
      </div>
    </div>
  );
};