import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText, Building2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";

type ExportType = "trips" | "fuel" | "maintenance" | "vehicles" | "drivers" | "full_ledger";
type ExportFormat = "xlsx" | "csv";

export function Exports() {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<ExportType>("trips");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      let data: any[] = [];
      let filename = "";

      switch (exportType) {
        case "trips": {
          const { data: trips, error } = await supabase
            .from("vehicle_logs")
            .select("*, vehicles(plate_number, make, model)")
            .order("start_time", { ascending: false });
          if (error) throw error;
          data = (trips || []).map((t) => ({
            "Date": format(new Date(t.start_time), "yyyy-MM-dd"),
            "Start Time": format(new Date(t.start_time), "HH:mm"),
            "End Time": t.end_time ? format(new Date(t.end_time), "HH:mm") : "",
            "Vehicle": t.vehicles?.plate_number || "",
            "Start KM": t.start_kilometers,
            "End KM": t.end_kilometers,
            "Total KM": t.end_kilometers - t.start_kilometers,
            "Purpose": t.purpose,
            "Cargo/Work": t.cargo_description || "",
            "Cargo Weight (kg)": t.cargo_weight_kg || "",
            "Work Order #": t.work_order_number || "",
            "Client": t.client_name || "",
            "Delivery Address": t.delivery_address || "",
            "Approval Status": t.approval_status,
            "Comments": t.comments || "",
          }));
          filename = `trip-logs-${format(new Date(), "yyyy-MM-dd")}`;
          break;
        }
        case "fuel": {
          const { data: fuel, error } = await supabase
            .from("fuel_logs")
            .select("*, vehicles(plate_number)")
            .order("created_at", { ascending: false });
          if (error) throw error;
          data = (fuel || []).map((f) => ({
            "Date": format(new Date(f.created_at), "yyyy-MM-dd"),
            "Vehicle": f.vehicles?.plate_number || "",
            "Fuel Type": (f as any).fuel_type || "diesel",
            "Liters": f.liters_added,
            "Cost/Liter": f.cost_per_liter,
            "Total Cost": f.total_cost,
            "Odometer": f.odometer_reading,
            "Station": (f as any).station_name || "",
            "Notes": (f as any).notes || "",
          }));
          filename = `fuel-logs-${format(new Date(), "yyyy-MM-dd")}`;
          break;
        }
        case "maintenance": {
          const { data: services, error } = await supabase
            .from("vehicle_services")
            .select("*, vehicles(plate_number)")
            .order("service_date", { ascending: false });
          if (error) throw error;
          data = (services || []).map((s: any) => ({
            "Date": s.service_date,
            "Vehicle": s.vehicles?.plate_number || "",
            "Service Type": s.service_type,
            "Cost": s.cost || 0,
            "Kilometers": s.kilometers,
            "Description": s.description || "",
          }));
          filename = `maintenance-${format(new Date(), "yyyy-MM-dd")}`;
          break;
        }
        case "vehicles": {
          const { data: vehicles, error } = await supabase
            .from("vehicles")
            .select("*")
            .order("plate_number");
          if (error) throw error;
          data = (vehicles || []).map((v) => ({
            "Plate Number": v.plate_number,
            "Make": v.make,
            "Model": v.model,
            "Year": v.year,
            "Current KM": v.current_kilometers || 0,
            "Service Interval": v.service_interval || "",
            "Insurance Expiry": v.insurance_expiry || "",
            "Road Tax Expiry": v.road_tax_expiry || "",
            "Fitness Expiry": v.fitness_expiry || "",
          }));
          filename = `vehicles-${format(new Date(), "yyyy-MM-dd")}`;
          break;
        }
        case "drivers": {
          const { data: drivers, error } = await supabase
            .from("drivers")
            .select("*, profiles:profile_id(full_name, email)")
            .order("man_number");
          if (error) throw error;
          data = (drivers || []).map((d: any) => ({
            "MAN Number": d.man_number,
            "Name": d.profiles?.full_name || "",
            "Email": d.profiles?.email || "",
            "License Number": d.license_number || "",
            "License Expiry": d.license_expiry || "",
          }));
          filename = `drivers-${format(new Date(), "yyyy-MM-dd")}`;
          break;
        }
        case "full_ledger": {
          // Combined export of all cost-related data for accounting
          const [fuelRes, maintRes, tripsRes] = await Promise.all([
            supabase.from("fuel_logs").select("*, vehicles(plate_number)").order("created_at"),
            supabase.from("vehicle_services").select("*, vehicles(plate_number)").order("service_date"),
            supabase.from("vehicle_logs").select("*, vehicles(plate_number)").order("start_time"),
          ]);

          const ledgerEntries: any[] = [];

          (fuelRes.data || []).forEach((f) => {
            ledgerEntries.push({
              "Date": format(new Date(f.created_at), "yyyy-MM-dd"),
              "Type": "Fuel",
              "Vehicle": f.vehicles?.plate_number || "",
              "Description": `${(f as any).fuel_type || "diesel"} - ${f.liters_added}L`,
              "Debit (Cost)": f.total_cost,
              "Credit": "",
              "Reference": (f as any).station_name || "",
              "Category": "Fuel Expense",
              "GL Code": "5100",
            });
          });

          (maintRes.data || []).forEach((s: any) => {
            ledgerEntries.push({
              "Date": s.service_date,
              "Type": "Maintenance",
              "Vehicle": s.vehicles?.plate_number || "",
              "Description": s.service_type + (s.description ? ` - ${s.description}` : ""),
              "Debit (Cost)": s.cost || 0,
              "Credit": "",
              "Reference": s.id?.substring(0, 8),
              "Category": "Maintenance Expense",
              "GL Code": "5200",
            });
          });

          (tripsRes.data || []).forEach((t) => {
            const km = (t.end_kilometers || 0) - (t.start_kilometers || 0);
            ledgerEntries.push({
              "Date": format(new Date(t.start_time), "yyyy-MM-dd"),
              "Type": "Trip",
              "Vehicle": t.vehicles?.plate_number || "",
              "Description": `${t.purpose} - ${km}km` + (t.cargo_description ? ` [${t.cargo_description}]` : ""),
              "Debit (Cost)": "",
              "Credit": "",
              "Reference": t.work_order_number || t.client_name || "",
              "Category": "Operations",
              "GL Code": "4100",
            });
          });

          ledgerEntries.sort((a, b) => a.Date.localeCompare(b.Date));
          data = ledgerEntries;
          filename = `full-ledger-${format(new Date(), "yyyy-MM-dd")}`;
          break;
        }
      }

      if (data.length === 0) {
        toast({ title: "No Data", description: "No records found for export" });
        setExporting(false);
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const colWidths = Object.keys(data[0]).map((key) => ({
        wch: Math.max(key.length, ...data.map((row) => String(row[key] || "").length)) + 2,
      }));
      ws["!cols"] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, exportType === "full_ledger" ? "Ledger" : exportType.charAt(0).toUpperCase() + exportType.slice(1));

      if (exportFormat === "xlsx") {
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
      }

      toast({ title: "Exported", description: `${data.length} records exported as ${exportFormat.toUpperCase()}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Export Failed", description: error.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Export & Accounting</h1>
        <p className="text-muted-foreground mt-1">
          Export data for accounting software, ERP systems, and compliance reporting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Export Settings</CardTitle>
            <CardDescription>Select what to export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trips">Trip Logs</SelectItem>
                  <SelectItem value="fuel">Fuel Logs</SelectItem>
                  <SelectItem value="maintenance">Maintenance Records</SelectItem>
                  <SelectItem value="vehicles">Vehicle Register</SelectItem>
                  <SelectItem value="drivers">Driver Register</SelectItem>
                  <SelectItem value="full_ledger">Full Cost Ledger (ERP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {exporting ? "Exporting..." : "Download Export"}
            </Button>
          </CardContent>
        </Card>

        {/* Export Descriptions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-lg">Trip Logs</CardTitle>
                <CardDescription>Complete trip records with cargo/work details, km, and approval status</CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto">Operations</Badge>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-orange-500" />
              <div>
                <CardTitle className="text-lg">Fuel Logs</CardTitle>
                <CardDescription>Refill history with prices, liters, stations, and per-vehicle cost tracking</CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto">Expenses</Badge>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-blue-500" />
              <div>
                <CardTitle className="text-lg">Maintenance Records</CardTitle>
                <CardDescription>Service history with costs, parts, and service types per vehicle</CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto">Expenses</Badge>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-lg">Full Cost Ledger (ERP)</CardTitle>
                <CardDescription>Combined fuel + maintenance + trip data with GL codes, ready for accounting import</CardDescription>
              </div>
              <Badge className="ml-auto">ERP Ready</Badge>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
