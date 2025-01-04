import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: any[];
  filename: string;
  type?: 'xlsx' | 'csv';
}

export function ExportButton({ data, filename, type = 'xlsx' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      
      if (type === 'xlsx') {
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
      }

      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={exporting}>
      <Download className="mr-2 h-4 w-4" />
      {exporting ? "Exporting..." : "Export"}
    </Button>
  );
}