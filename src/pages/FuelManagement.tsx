import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Fuel, TrendingUp, DollarSign, Droplets } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/reports/ExportButton";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

export function FuelManagement() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const userProfile = profile.get();

  const [form, setForm] = useState({
    vehicle_id: "",
    liters_added: "",
    cost_per_liter: "",
    total_cost: "",
    odometer_reading: "",
    fuel_type: "diesel",
    station_name: "",
    notes: "",
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-fuel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, plate_number, make, model");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fuelLogs, isLoading, error: fuelError, refetch } = useQuery({
    queryKey: ["fuel-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select(`*, vehicles (plate_number, make, model)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Surface fetch failures via toast
  if (fuelError) {
    toast.error("Failed to load fuel logs", {
      id: "fuel-logs-error",
      description: (fuelError as Error)?.message,
      action: { label: "Retry", onClick: () => refetch() },
    });
  }

  const addFuelLog = useMutation({
    mutationFn: async () => {
      const liters = parseFloat(form.liters_added);
      const costPerLiter = parseFloat(form.cost_per_liter);
      const totalCost = parseFloat(form.total_cost) || liters * costPerLiter;
      const odometer = parseInt(form.odometer_reading);

      const { error } = await supabase.from("fuel_logs").insert({
        vehicle_id: form.vehicle_id,
        liters_added: liters,
        cost_per_liter: costPerLiter,
        total_cost: totalCost,
        odometer_reading: odometer,
        fuel_type: form.fuel_type,
        station_name: form.station_name || null,
        notes: form.notes || null,
        company_id: userProfile?.company_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      toast.success("Fuel log added");
      setShowAddForm(false);
      setForm({ vehicle_id: "", liters_added: "", cost_per_liter: "", total_cost: "", odometer_reading: "", fuel_type: "diesel", station_name: "", notes: "" });
    },
    onError: (error: any) => {
      toast.error("Failed to save fuel log", { description: error?.message });
    },
  });

  const handleLitersOrPriceChange = (field: string, value: string) => {
    const updated = { ...form, [field]: value };
    const liters = parseFloat(updated.liters_added) || 0;
    const costPerLiter = parseFloat(updated.cost_per_liter) || 0;
    updated.total_cost = (liters * costPerLiter).toFixed(2);
    setForm(updated);
  };

  const totalCost = fuelLogs?.reduce((sum, l) => sum + (l.total_cost || 0), 0) || 0;
  const totalLiters = fuelLogs?.reduce((sum, l) => sum + (l.liters_added || 0), 0) || 0;
  const avgCostPerLiter = fuelLogs && fuelLogs.length > 0
    ? (fuelLogs.reduce((sum, l) => sum + (l.cost_per_liter || 0), 0) / fuelLogs.length).toFixed(2)
    : "0.00";

  const exportData = fuelLogs?.map(log => ({
    Date: format(new Date(log.created_at), "yyyy-MM-dd"),
    Vehicle: log.vehicles?.plate_number || "",
    "Fuel Type": (log as any).fuel_type || "diesel",
    "Liters Added": log.liters_added,
    "Cost Per Liter": log.cost_per_liter,
    "Total Cost": log.total_cost,
    "Odometer Reading": log.odometer_reading,
    Station: (log as any).station_name || "",
    Notes: (log as any).notes || "",
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Fuel Management</h1>
          <p className="text-muted-foreground mt-1">Track fuel refills, costs, and consumption</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={exportData} filename="fuel-report" />
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Log Refill
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Liters</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLiters.toFixed(1)} L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Liter</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgCostPerLiter}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Log List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : fuelLogs && fuelLogs.length > 0 ? (
        <div className="space-y-3">
          {fuelLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(log.created_at), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">{log.vehicles?.plate_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <Badge variant="outline">{(log as any).fuel_type || "diesel"}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Liters</p>
                    <p className="font-medium">{log.liters_added} L</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cost/Liter</p>
                    <p className="font-medium">${log.cost_per_liter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">${log.total_cost}</p>
                  </div>
                </div>
                {((log as any).station_name || (log as any).notes) && (
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                    {(log as any).station_name && <span>Station: {(log as any).station_name}</span>}
                    {(log as any).notes && <span className="ml-4">Notes: {(log as any).notes}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Fuel}
          title="No fuel logs yet"
          description="Track every refill to monitor consumption, spend and price trends."
          action={
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Log first refill
            </Button>
          }
        />
      )}

      {/* Add Fuel Log Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Fuel Refill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vehicle *</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuel Type</Label>
              <Select value={form.fuel_type} onValueChange={(v) => setForm({ ...form, fuel_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="lpg">LPG</SelectItem>
                  <SelectItem value="electric">Electric (kWh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Liters Added *</Label>
                <Input type="number" step="0.01" value={form.liters_added} onChange={(e) => handleLitersOrPriceChange("liters_added", e.target.value)} />
              </div>
              <div>
                <Label>Cost Per Liter *</Label>
                <Input type="number" step="0.01" value={form.cost_per_liter} onChange={(e) => handleLitersOrPriceChange("cost_per_liter", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Cost</Label>
                <Input type="number" step="0.01" value={form.total_cost} onChange={(e) => setForm({ ...form, total_cost: e.target.value })} />
              </div>
              <div>
                <Label>Odometer Reading *</Label>
                <Input type="number" value={form.odometer_reading} onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Station Name</Label>
              <Input value={form.station_name} onChange={(e) => setForm({ ...form, station_name: e.target.value })} placeholder="e.g. Shell Main St" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" />
            </div>
            <Button
              className="w-full"
              onClick={() => addFuelLog.mutate()}
              disabled={addFuelLog.isPending || !form.vehicle_id || !form.liters_added || !form.cost_per_liter || !form.odometer_reading}
            >
              {addFuelLog.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Fuel Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
