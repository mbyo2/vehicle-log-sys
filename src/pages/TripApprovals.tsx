
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Check, X, Calendar, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface TripLog {
  id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  start_kilometers: number;
  end_kilometers: number;
  approval_status: string;
  approval_comment?: string;
  vehicle_id: string;
  drivers: {
    id: string;
    profile_id: string;
    profiles: {
      full_name: string;
    };
  };
  vehicles: {
    plate_number: string;
    make: string;
    model: string;
    current_kilometers: number;
  };
}

export function TripApprovals() {
  const { toast } = useToast();
  const { sendNotification } = useNotifications();
  const { profile } = useAuth();
  const [selectedTab, setSelectedTab] = useState("pending");

  const profileData = profile?.get();
  const userId = profileData?.id;

  const { data: trips, isLoading, refetch } = useQuery({
    queryKey: ["trips", selectedTab],
    queryFn: async () => {
      const { data, error } = await supabase
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
          vehicle_id,
          drivers!inner(
            id,
            profile_id,
            profiles!inner(full_name)
          ),
          vehicles!inner(
            plate_number,
            make,
            model,
            current_kilometers
          )
        `)
        .eq("approval_status", selectedTab);

      if (error) throw error;
      return data as unknown as TripLog[];
    },
  });

  const handleApproval = async (tripId: string, status: "approved" | "rejected", comment?: string) => {
    try {
      const trip = trips?.find(t => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // First update the trip log status
      const { error: updateError } = await supabase
        .from("vehicle_logs")
        .update({
          approval_status: status,
          approval_comment: comment,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", tripId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from("trip_approvals")
        .insert({
          trip_id: tripId,
          status,
          comment,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (approvalError) throw approvalError;

      // Send notification to the driver
      if (userId && trip.drivers.profile_id) {
        await sendNotification.mutateAsync({
          to: [trip.drivers.profile_id],
          subject: `Trip ${status}`,
          type: status === "approved" ? "user_action" : "approval_required",
          details: {
            message: `Your trip with vehicle ${trip.vehicles.plate_number} has been ${status}.`,
            vehicle: `${trip.vehicles.make} ${trip.vehicles.model} (${trip.vehicles.plate_number})`,
            actionRequired: status === "rejected" ? "Please review and submit a new trip request" : undefined,
            comment: comment || undefined
          },
          // Send urgent notifications for rejections, regular for approvals
          delivery: status === "rejected" ? "all" : "in_app"
        });
      }

      toast({
        title: `Trip ${status}`,
        description: `The trip has been ${status} successfully.`,
      });

      refetch();
    } catch (error) {
      console.error('Error updating trip status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update trip status.",
      });
    }
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Trip Approvals</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          {isLoading ? (
            <div>Loading trips...</div>
          ) : (
            <div className="grid gap-4">
              {trips?.map((trip) => (
                <Card key={trip.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">
                      Trip Request - {trip.vehicles.plate_number}
                    </CardTitle>
                    {getStatusBadge(trip.approval_status)}
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Driver: {trip.drivers.profiles.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Date: {format(new Date(trip.start_time), "PPP")}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>Vehicle: {trip.vehicles.make} {trip.vehicles.model}</div>
                          <div>Purpose: {trip.purpose}</div>
                          <div>
                            Distance: {trip.end_kilometers - trip.start_kilometers} km
                          </div>
                        </div>
                      </div>

                      {trip.approval_comment && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-muted rounded-md">
                          <MessageSquare className="h-4 w-4 mt-1" />
                          <p>{trip.approval_comment}</p>
                        </div>
                      )}

                      {trip.approval_status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleApproval(trip.id, "approved")}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              const comment = window.prompt("Reason for rejection:");
                              if (comment) {
                                handleApproval(trip.id, "rejected", comment);
                              }
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
