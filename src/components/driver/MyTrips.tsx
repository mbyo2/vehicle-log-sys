import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentDriver } from "@/hooks/useCurrentDriver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, Plus, Route } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const emptyForm = {
  vehicle_id: "",
  start_kilometers: "",
  end_kilometers: "",
  start_time: "",
  end_time: "",
  purpose: "",
  comments: "",
};

function statusVariant(status: string) {
  if (status === "approved") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "secondary" as const;
}

export function MyTrips() {
  const { driverId, companyId, isLoading: driverLoading } = useCurrentDriver();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: vehicles } = useQuery({
    queryKey: ["driver-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, plate_number, make, model, current_kilometers")
        .order("plate_number");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: trips, isLoading } = useQuery({
    queryKey: ["my-trips", driverId],
    queryFn: async () => {
      if (!driverId) return [];
      const { data, error } = await supabase
        .from("vehicle_logs")
        .select("*, vehicles (plate_number, make, model)")
        .eq("driver_id", driverId)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driverId,
  });

  const saveTrip = useMutation({
    mutationFn: async () => {
      if (!driverId) throw new Error("Your driver record could not be found. Ask your administrator to link your account.");

      const startKm = parseInt(form.start_kilometers, 10);
      const endKm = parseInt(form.end_kilometers, 10);
      if (Number.isNaN(startKm) || Number.isNaN(endKm)) throw new Error("Enter both the start and end kilometres.");
      if (endKm < startKm) throw new Error("End kilometres cannot be lower than start kilometres.");
      if (!form.start_time || !form.end_time) throw new Error("Enter both the start and end time.");
      if (new Date(form.end_time) < new Date(form.start_time)) throw new Error("The end time cannot be before the start time.");
      if (!form.purpose.trim()) throw new Error("Enter the purpose of the trip.");

      const { error } = await supabase.from("vehicle_logs").insert({
        vehicle_id: form.vehicle_id,
        driver_id: driverId,
        company_id: companyId,
        start_kilometers: startKm,
        end_kilometers: endKm,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        purpose: form.purpose.trim(),
        comments: form.comments.trim() || null,
        approval_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Trip submitted for approval");
      setForm(emptyForm);
      setOpen(false);
    },
    onError: (error: Error) => toast.error("Could not save trip", { description: error.message }),
  });

  const pendingCount = trips?.filter((t) => t.approval_status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">My Trips</h2>
          <p className="text-muted-foreground text-sm">
            {pendingCount > 0 ? `${pendingCount} trip${pendingCount > 1 ? "s" : ""} waiting for approval` : "All your trips have been reviewed"}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={driverLoading}>
          <Plus className="h-4 w-4 mr-2" /> Record trip
        </Button>
      </div>

      {isLoading || driverLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : trips && trips.length > 0 ? (
        <div className="space-y-3">
          {trips.map((trip: any) => (
            <Card key={trip.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">
                  {trip.vehicles?.plate_number} · {trip.purpose}
                </CardTitle>
                <Badge variant={statusVariant(trip.approval_status)}>
                  {trip.approval_status === "pending" ? "Waiting for approval" : trip.approval_status}
                </Badge>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(trip.start_time), "MMM dd, yyyy HH:mm")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Distance</p>
                  <p className="font-medium">{trip.end_kilometers - trip.start_kilometers} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start / End km</p>
                  <p className="font-medium">{trip.start_kilometers} → {trip.end_kilometers}</p>
                </div>
                {trip.approval_comment && (
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-muted-foreground">Reviewer note</p>
                    <p className="font-medium">{trip.approval_comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Route}
          title="No trips recorded yet"
          description="Record a trip and it will be sent to your supervisor for approval."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Record trip</Button>}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record a trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vehicle *</Label>
              <Select
                value={form.vehicle_id}
                onValueChange={(v) => {
                  const vehicle = vehicles?.find((x) => x.id === v);
                  setForm({
                    ...form,
                    vehicle_id: v,
                    start_kilometers: form.start_kilometers || (vehicle?.current_kilometers?.toString() ?? ""),
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start kilometres *</Label>
                <Input type="number" value={form.start_kilometers} onChange={(e) => setForm({ ...form, start_kilometers: e.target.value })} />
              </div>
              <div>
                <Label>End kilometres *</Label>
                <Input type="number" value={form.end_kilometers} onChange={(e) => setForm({ ...form, end_kilometers: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start time *</Label>
                <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End time *</Label>
                <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Purpose *</Label>
              <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Delivery to client" />
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
            </div>
            <Button className="w-full" onClick={() => saveTrip.mutate()} disabled={saveTrip.isPending || !form.vehicle_id}>
              {saveTrip.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
