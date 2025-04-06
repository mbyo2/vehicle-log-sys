import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, MessageSquare, FileText } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TripLog } from "@/types/vehicle";

export interface TripListProps {
  filterType: "my-trips" | "pending-approval" | "all";
  trips?: TripLog[];
  onRefresh?: () => Promise<void>;
}

interface TripData {
  id: string;
  start_time: string;
  end_time: string | null;
  purpose: string;
  start_kilometers: number;
  end_kilometers: number | null;
  approval_status: string;
  approval_comment: string | null;
  comments: string | null;
  driver_id: string;
  vehicle_id: string;
  drivers: {
    id: string;
    man_number: string;
    profiles: {
      full_name: string;
    };
  };
  vehicles: {
    plate_number: string;
    make: string;
    model: string;
  };
}

export function TripList({ filterType, trips: initialTrips, onRefresh }: TripListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  
  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips", filterType],
    queryFn: async () => {
      if (initialTrips) {
        return initialTrips;
      }
      
      let query = supabase
        .from("vehicle_logs")
        .select(`
          id,
          start_time,
          end_time,
          purpose,
          start_kilometers,
          end_kilometers,
          approval_status,
          approval_comment,
          comments,
          driver_id,
          vehicle_id,
          drivers:driver_id(
            id,
            man_number,
            profiles(
              full_name
            )
          ),
          vehicles:vehicle_id(
            plate_number,
            make,
            model
          )
        `);
      
      if (filterType === "my-trips" && user) {
        const { data: driverData } = await supabase
          .from("drivers")
          .select("id")
          .eq("profile_id", user.id)
          .single();
          
        if (driverData) {
          query = query.eq("driver_id", driverData.id);
        }
      } else if (filterType === "pending-approval") {
        query = query.eq("approval_status", "pending");
      }
      
      query = query.order("start_time", { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const transformedData = data?.map(trip => {
        const driversData = Array.isArray(trip.drivers) ? trip.drivers[0] : trip.drivers;
        const driverProfiles = Array.isArray(driversData?.profiles) 
          ? driversData.profiles[0] 
          : driversData?.profiles;
        
        const vehiclesData = Array.isArray(trip.vehicles) ? trip.vehicles[0] : trip.vehicles;
        
        return {
          ...trip,
          drivers: {
            ...driversData,
            profiles: driverProfiles
          },
          vehicles: vehiclesData
        } as TripData;
      });
      
      return transformedData || [];
    },
    enabled: !!user || !!initialTrips,
  });
  
  const { data: selectedTrip } = useQuery({
    queryKey: ["trip", selectedTripId],
    queryFn: async () => {
      if (!selectedTripId) return null;
      
      const { data, error } = await supabase
        .from("vehicle_logs")
        .select(`
          *,
          drivers:driver_id(
            id,
            man_number,
            profiles(
              full_name
            )
          ),
          vehicles:vehicle_id(
            plate_number,
            make,
            model
          )
        `)
        .eq("id", selectedTripId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTripId,
  });
  
  const tripApprovalMutation = useMutation({
    mutationFn: async ({ 
      tripId, 
      status, 
      comment 
    }: { 
      tripId: string; 
      status: 'approved' | 'rejected'; 
      comment?: string;
    }) => {
      if (!user) throw new Error("You must be logged in to perform this action");
      
      const { error: updateError } = await supabase
        .from("vehicle_logs")
        .update({
          approval_status: status,
          approval_comment: comment,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", tripId);
        
      if (updateError) throw updateError;
      
      await supabase.from("audit_logs").insert({
        table_name: "vehicle_logs",
        record_id: tripId,
        action: `trip_${status}`,
        performed_by: user.id,
        new_data: {
          status,
          comment
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setApprovalComment("");
      setRejectionReason("");
      setSelectedTripId(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  const handleApprove = (tripId: string) => {
    tripApprovalMutation.mutate({ 
      tripId, 
      status: "approved", 
      comment: approvalComment 
    });
  };
  
  const handleReject = (tripId: string) => {
    if (!rejectionReason) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason for rejection",
      });
      return;
    }
    
    tripApprovalMutation.mutate({ 
      tripId, 
      status: "rejected", 
      comment: rejectionReason 
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Distance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips?.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell>
                {trip.date || (trip.start_time && format(new Date(trip.start_time), "MMM dd, yyyy"))}
              </TableCell>
              <TableCell>
                {trip.plateNumber || (trip.vehicles?.plate_number || '')}
              </TableCell>
              <TableCell>
                {trip.driver || (trip.drivers?.profiles?.full_name || '')}
              </TableCell>
              <TableCell>{trip.purpose}</TableCell>
              <TableCell>
                {(typeof trip.totalKilometers === 'number' ? trip.totalKilometers : 
                  trip.end_kilometers && trip.start_kilometers 
                  ? (trip.end_kilometers - trip.start_kilometers)
                  : 0).toFixed(1)} km
              </TableCell>
              <TableCell>{getStatusBadge(trip.approval_status)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setShowDetails(true);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  
                  {filterType === "pending-approval" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-600"
                        onClick={() => {
                          setSelectedTripId(trip.id);
                          setApprovalComment("");
                          setShowDetails(false);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-600"
                        onClick={() => {
                          setSelectedTripId(trip.id);
                          setRejectionReason("");
                          setShowDetails(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {(!trips || trips.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          No trips found
        </div>
      )}
      
      <Dialog open={showDetails && !!selectedTripId} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Driver</Label>
                  <p className="font-medium">{selectedTrip.drivers?.profiles?.full_name}</p>
                </div>
                
                <div>
                  <Label>Vehicle</Label>
                  <p className="font-medium">
                    {selectedTrip.vehicles?.plate_number} - {selectedTrip.vehicles?.make} {selectedTrip.vehicles?.model}
                  </p>
                </div>
                
                <div>
                  <Label>Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedTrip.start_time), "PPP")}
                  </p>
                </div>
                
                <div>
                  <Label>Purpose</Label>
                  <p className="font-medium">{selectedTrip.purpose}</p>
                </div>
                
                <div>
                  <Label>Start Time</Label>
                  <p className="font-medium">
                    {format(new Date(selectedTrip.start_time), "HH:mm")}
                  </p>
                </div>
                
                <div>
                  <Label>End Time</Label>
                  <p className="font-medium">
                    {selectedTrip.end_time 
                      ? format(new Date(selectedTrip.end_time), "HH:mm")
                      : "-"}
                  </p>
                </div>
                
                <div>
                  <Label>Start Kilometers</Label>
                  <p className="font-medium">{selectedTrip.start_kilometers}</p>
                </div>
                
                <div>
                  <Label>End Kilometers</Label>
                  <p className="font-medium">{selectedTrip.end_kilometers || "-"}</p>
                </div>
                
                <div className="col-span-2">
                  <Label>Distance</Label>
                  <p className="font-medium">
                    {selectedTrip.end_kilometers && selectedTrip.start_kilometers
                      ? (selectedTrip.end_kilometers - selectedTrip.start_kilometers).toFixed(1)
                      : "-"} km
                  </p>
                </div>
                
                {selectedTrip.comments && (
                  <div className="col-span-2">
                    <Label>Comments</Label>
                    <p className="whitespace-pre-wrap">{selectedTrip.comments}</p>
                  </div>
                )}
                
                <div className="col-span-2">
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTrip.approval_status)}</div>
                </div>
                
                {selectedTrip.approval_comment && (
                  <div className="col-span-2 bg-muted p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Approval Comment</p>
                        <p className="text-sm">{selectedTrip.approval_comment}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog 
        open={!showDetails && !!selectedTripId && selectedTrip?.approval_status === "pending"} 
        onOpenChange={(open) => {
          if (!open) setSelectedTripId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Trip</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="approvalComment">Comment (Optional)</Label>
              <Textarea
                id="approvalComment"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add any comments about this approval"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedTripId(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedTripId && handleApprove(selectedTripId)}
                disabled={tripApprovalMutation.isPending}
              >
                {tripApprovalMutation.isPending ? "Processing..." : "Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog 
        open={!showDetails && !!selectedTripId && selectedTrip?.approval_status === "pending" && !!rejectionReason} 
        onOpenChange={(open) => {
          if (!open) setSelectedTripId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Trip</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejecting this trip"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedTripId(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => selectedTripId && handleReject(selectedTripId)}
                disabled={tripApprovalMutation.isPending || !rejectionReason}
              >
                {tripApprovalMutation.isPending ? "Processing..." : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
