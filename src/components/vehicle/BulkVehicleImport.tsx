import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

export const BulkVehicleImport = () => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const vehicle of jsonData) {
          const { error } = await supabase
            .from('vehicles')
            .insert({
              plate_number: vehicle.plate_number,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              service_interval: vehicle.service_interval || 5000,
              current_kilometers: vehicle.current_kilometers || 0,
              fitness_cert_expiry: vehicle.fitness_cert_expiry,
              road_tax_expiry: vehicle.road_tax_expiry,
              insurance_expiry: vehicle.insurance_expiry
            });

          if (error) throw error;
        }

        toast({
          title: "Success",
          description: `Imported ${jsonData.length} vehicles successfully`,
        });
      };

      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  const exportVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');

      if (error) throw error;

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');
      XLSX.writeFile(workbook, 'vehicles_export.xlsx');

      toast({
        title: "Success",
        description: "Vehicles exported successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="flex gap-4">
      <div>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          id="vehicle-import"
        />
        <Button 
          disabled={importing}
          onClick={() => document.getElementById('vehicle-import')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {importing ? 'Importing...' : 'Import Vehicles'}
        </Button>
      </div>
      
      <Button onClick={exportVehicles}>
        <Download className="h-4 w-4 mr-2" />
        Export Vehicles
      </Button>
    </div>
  );
};