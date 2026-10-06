import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentDriver } from "@/hooks/useCurrentDriver";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Fuel, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const emptyForm = { vehicle_id: "", liters_added: "", cost_per_liter: "", odometer_reading: "", fuel_type: "diesel", station_name: "" };

export function MyFuelLogs() {
  const { driverId, companyId, isLoading: driverLoading } = useCurrentDriver();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: vehicles } = useQuery({
    queryKey: ["driver-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, plate_number, make, model, current_kilometers").order("plate_number");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["my-fuel-logs", driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*, vehicles (plate_number)")
        .eq("driver_id", driverId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driverId,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!driverId) throw new Error("Your driver record could not be found. Ask your administrator to link your account.");
      const liters = parseFloat(form.liters_added);
      const price = parseFloat(form.cost_per_liter);
      const odo = parseInt(form.odometer_reading, 10);
      if (!(liters > 0) || !(price > 0) || Number.isNaN(odo)) throw new Error("Enter litres, price per litre and odometer reading.");
      const { error } = await supabase.from("fuel_logs").insert({
        vehicle_id: form.vehicle_id,
        driver_id: driverId,
        company_id: companyId,
        liters_added: liters,
        cost_per_liter: price,
        total_cost: +(liters * price).toFixed(2),
        odometer_reading: odo,
        fuel_type: form.fuel_type,
        station_name: form.station_name.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-fuel-logs"] });
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      toast.success("Fuel log saved");
      setForm(emptyForm);
      setOpen(false);
    },
    onError: (e: Error) => toast.error("Could not save fuel log", { description: e.message }),
  });

  const total = (parseFloat(form.liters_added) || 0) * (parseFloat(form.cost_per_liter) || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">My Fuel Logs</h2>
          <p className="text-muted-foreground text-sm">Only your own fill-ups are shown here.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={driverLoading}><Plus className="h-4 w-4 mr-2" /> Log fill-up</Button>
      </div>

      {isLoading || driverLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : logs && logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{format(new Date(log.created_at), "MMM dd, yyyy")}</p></div>
                <div><p className="text-muted-foreground">Vehicle</p><p className="font-medium">{log.vehicles?.plate_number}</p></div>
                <div><p className="text-muted-foreground">Litres</p><p className="font-medium">{log.liters_added} L</p></div>
                <div><p className="text-muted-foreground">Odometer</p><p className="font-medium">{log.odometer_reading} km</p></div>
                <div><p className="text-muted-foreground">Total</p><p className="font-bold text-primary">{Number(log.total_cost).toFixed(2)}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Fuel} title="No fill-ups yet" description="Log each refuel so your fleet manager can track consumption."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Log fill-up</Button>} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log a fill-up</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vehicle *</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => {
                const veh = vehicles?.find((x) => x.id === v);
                setForm({ ...form, vehicle_id: v, odometer_reading: form.odometer_reading || (veh?.current_kilometers?.toString() ?? "") });
              }}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuel type</Label>
              <Select value={form.fuel_type} onValueChange={(v) => setForm({ ...form, fuel_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="lpg">LPG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Litres *</Label><Input type="number" step="0.01" value={form.liters_added} onChange={(e) => setForm({ ...form, liters_added: e.target.value })} /></div>
              <div><Label>Price per litre *</Label><Input type="number" step="0.01" value={form.cost_per_liter} onChange={(e) => setForm({ ...form, cost_per_liter: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Odometer (km) *</Label><Input type="number" value={form.odometer_reading} onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })} /></div>
              <div><Label>Station</Label><Input value={form.station_name} onChange={(e) => setForm({ ...form, station_name: e.target.value })} /></div>
            </div>
            <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{total.toFixed(2)}</span></p>
            <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending || !form.vehicle_id}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save fill-up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
