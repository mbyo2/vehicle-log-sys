
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DriverProfile {
  full_name: string;
}

interface Driver {
  id: string;
  profiles: DriverProfile;
  man_number: string;
}

interface DriverSelectorProps {
  selectedDriverId: string | null;
  onDriverSelect: (driverId: string) => void;
  placeholder?: string;
}

export function DriverSelector({ 
  selectedDriverId, 
  onDriverSelect,
  placeholder = "Select a driver"
}: DriverSelectorProps) {
  const [open, setOpen] = useState(false);
  const [localSelectedDriverName, setLocalSelectedDriverName] = useState<string>('');
  
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers-for-selector'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          man_number,
          profiles:profile_id (
            full_name
          )
        `)
        .order('man_number');
      
      if (error) throw error;
      
      // Transform data to match Driver interface
      return (data || []).map(driver => ({
        id: driver.id,
        man_number: driver.man_number,
        profiles: {
          full_name: driver.profiles?.full_name || 'Unknown'
        }
      })) as Driver[];
    },
  });
  
  // Update the selected driver name when drivers data loads or selectedDriverId changes
  useEffect(() => {
    if (drivers && selectedDriverId) {
      const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);
      if (selectedDriver) {
        setLocalSelectedDriverName(selectedDriver.profiles.full_name);
      }
    }
  }, [drivers, selectedDriverId]);
  
  const handleSelectDriver = (driverId: string, driverName: string) => {
    onDriverSelect(driverId);
    setLocalSelectedDriverName(driverName);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Loading drivers...</span>
            </div>
          ) : selectedDriverId && localSelectedDriverName ? (
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              {localSelectedDriverName}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search driver..." />
          <CommandEmpty>No driver found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {drivers?.map((driver) => (
              <CommandItem
                key={driver.id}
                value={driver.profiles.full_name}
                onSelect={() => handleSelectDriver(driver.id, driver.profiles.full_name)}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedDriverId === driver.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{driver.profiles.full_name}</span>
                  <span className="text-xs text-muted-foreground">MAN #: {driver.man_number}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
