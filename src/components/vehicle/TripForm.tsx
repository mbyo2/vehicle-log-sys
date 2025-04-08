
// Basic TripForm component implementation if it doesn't exist
import { TripLog } from '@/types/vehicle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface TripFormProps {
  tripLog: TripLog;
  onTripLogChange: (updates: Partial<TripLog>) => void;
  tripPurposes?: string[];
}

export function TripForm({ tripLog, onTripLogChange, tripPurposes = ['Business', 'Personal', 'Maintenance'] }: TripFormProps) {
  const handleChange = (field: keyof TripLog, value: string | number) => {
    onTripLogChange({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={tripLog.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Select 
            value={tripLog.purpose} 
            onValueChange={(value) => handleChange('purpose', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trip purpose" />
            </SelectTrigger>
            <SelectContent>
              {tripPurposes.map((purpose) => (
                <SelectItem key={purpose} value={purpose}>
                  {purpose}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={tripLog.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={tripLog.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startKilometers">Start Odometer Reading</Label>
          <Input
            id="startKilometers"
            type="number"
            value={tripLog.startKilometers}
            onChange={(e) => handleChange('startKilometers', Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="endKilometers">End Odometer Reading</Label>
          <Input
            id="endKilometers"
            type="number"
            value={tripLog.endKilometers}
            onChange={(e) => handleChange('endKilometers', Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Comments</Label>
        <Textarea
          id="comment"
          value={tripLog.comment}
          onChange={(e) => handleChange('comment', e.target.value)}
          placeholder="Any additional comments about the trip"
        />
      </div>
    </div>
  );
}
