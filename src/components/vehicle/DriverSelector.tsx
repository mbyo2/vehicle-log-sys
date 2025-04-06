
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from '@/hooks/useIsMobile';
import { useToast } from '@/hooks/use-toast';

interface DriverOption {
  value: string;
  label: string;
}

interface DriverSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DriverSelector({ value, onChange, disabled = false }: DriverSelectorProps) {
  const [open, setOpen] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    async function loadDrivers() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('role', 'driver');
          
        if (error) {
          throw error;
        }
        
        // Transform the data into the format needed for the dropdown
        const driverOptions = data.map(driver => ({
          value: driver.id,
          label: driver.full_name || 'Unknown Driver'
        }));
        
        setDrivers(driverOptions);
      } catch (error) {
        console.error('Error loading drivers:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load drivers. Please try again."
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadDrivers();
  }, [toast]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn("w-full justify-between", isMobile ? "text-sm" : "")}
        >
          {value ? drivers.find((driver) => driver.value === value)?.label || "Select driver" : "Select driver"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", isMobile ? "w-[250px]" : "w-[300px]")}>
        <Command>
          <CommandInput placeholder="Search driver..." />
          <CommandEmpty>No driver found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {drivers.map((driver) => (
              <CommandItem
                key={driver.value}
                value={driver.value}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === driver.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {driver.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
