
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TripLog } from "@/types/vehicle";
import { useAuth } from "@/contexts/AuthContext";
import { VehicleSelect } from "./VehicleSelect";

interface TripLogFormProps {
  tripLog: TripLog;
  onTripLogChange: (updates: Partial<TripLog>) => void;
}

export function TripLogForm({ tripLog, onTripLogChange }: TripLogFormProps) {
  const { user } = useAuth();
  const [driverName, setDriverName] = useState("");
  
  // Common trip purposes for autocomplete
  const commonPurposes = [
    "Client Visit",
    "Delivery",
    "Pickup",
    "Maintenance",
    "Administrative",
    "Other"
  ];
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    // Fetch the current user's driver information
    const fetchDriverInfo = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("drivers")
          .select(`
            id,
            man_number,
            profiles(full_name)
          `)
          .eq("profile_id", user.id)
          .single();
          
        if (!error && data) {
          setDriverName(data.profiles?.full_name || "");
          onTripLogChange({ 
            driver: data.man_number,
            driverId: data.id
          });
        }
      }
    };
    
    fetchDriverInfo();
  }, [user]);
  
  // Fetch vehicle details when selected
  const { data: selectedVehicle } = useQuery({
    queryKey: ["vehicle", tripLog.vehicleId],
    queryFn: async () => {
      if (!tripLog.vehicleId) return null;
      
      const { data, error } = await supabase
        .from("vehicles")
        .select("plate_number, current_kilometers")
        .eq("id", tripLog.vehicleId)
        .single();
        
      if (error) throw error;
      
      // Update the start kilometers based on the vehicle's current reading
      if (data) {
        onTripLogChange({ 
          plateNumber: data.plate_number,
          startKilometers: data.current_kilometers || 0 
        });
      }
      
      return data;
    },
    enabled: !!tripLog.vehicleId,
  });
  
  const handleEndKilometersChange = (value: number) => {
    const startKm = tripLog.startKilometers || 0;
    onTripLogChange({
      endKilometers: value,
      totalKilometers: value - startKm
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="driver">Driver</Label>
          <Input
            id="driver"
            value={driverName}
            readOnly
            className="bg-gray-100"
          />
        </div>
        
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={tripLog.date}
            onChange={(e) => onTripLogChange({ date: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="vehicle">Vehicle</Label>
        <VehicleSelect
          selectedId={tripLog.vehicleId}
          onSelect={(id) => onTripLogChange({ vehicleId: id })}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={tripLog.startTime}
            onChange={(e) => onTripLogChange({ startTime: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={tripLog.endTime}
            onChange={(e) => onTripLogChange({ endTime: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startKilometers">Start Kilometers</Label>
          <Input
            id="startKilometers"
            type="number"
            value={tripLog.startKilometers}
            readOnly
            className="bg-gray-100"
          />
        </div>
        
        <div>
          <Label htmlFor="endKilometers">End Kilometers</Label>
          <Input
            id="endKilometers"
            type="number"
            value={tripLog.endKilometers || ''}
            onChange={(e) => handleEndKilometersChange(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="space-y-2 relative">
        <Label htmlFor="purpose">Purpose</Label>
        <Input
          id="purpose"
          value={tripLog.purpose}
          onChange={(e) => onTripLogChange({ purpose: e.target.value })}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        {showSuggestions && (
          <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
            <div className="p-2">
              {commonPurposes
                .filter(purpose => 
                  purpose.toLowerCase().includes((tripLog.purpose || '').toLowerCase())
                )
                .map((purpose, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      onTripLogChange({ purpose });
                      setShowSuggestions(false);
                    }}
                  >
                    {purpose}
                  </div>
                ))
              }
            </div>
          </Card>
        )}
      </div>
      
      <div>
        <Label htmlFor="comments">Additional Comments</Label>
        <Textarea
          id="comments"
          value={tripLog.comment}
          onChange={(e) => onTripLogChange({ comment: e.target.value })}
          placeholder="Add any additional notes about this trip"
        />
      </div>
      
      {tripLog.totalKilometers > 0 && (
        <div className="bg-primary/10 p-4 rounded-md">
          <p className="font-medium">
            Total Distance: {tripLog.totalKilometers} km
          </p>
        </div>
      )}
    </div>
  );
}
