
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useTrainings } from "@/hooks/useTrainings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, FileCheck, MessageSquare, AlertTriangle, Car, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export function DriverDashboard() {
  const { profile } = useAuth();
  const { unreadCount } = useMessages();
  const { driverTrainings, expiringSoonCount } = useTrainings();
  const profileData = profile.get();
  const userId = profileData?.id;

  // Fetch assigned vehicle
  const { data: assignedVehicle } = useQuery({
    queryKey: ['assigned_vehicle', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('assigned_to', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is the "no rows returned" error
      return data;
    },
    enabled: !!userId,
  });

  // Fetch recent trips
  const { data: recentTrips } = useQuery({
    queryKey: ['recent_trips', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('trip_logs')
        .select('*')
        .eq('driver_id', userId)
        .order('start_time', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Driver Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              <Link to="/driver/messages" className="hover:underline">View all messages</Link>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Certifications</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverTrainings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              <Link to="/driver/trainings" className="hover:underline">View all certifications</Link>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoonCount}</div>
            <p className="text-xs text-muted-foreground">
              {expiringSoonCount > 0 ? 
                <Link to="/driver/trainings" className="text-amber-600 hover:underline">Requires attention</Link> :
                "All certifications valid"
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Vehicle</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model}` : "None"}</div>
            <p className="text-xs text-muted-foreground">
              {assignedVehicle ? assignedVehicle.plate_number : "No vehicle assigned"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Your latest vehicle trips</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTrips && recentTrips.length > 0 ? (
              <div className="space-y-4">
                {recentTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center border-b pb-2">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{trip.purpose}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(trip.start_time), 'MMM dd, yyyy')} - {trip.end_kilometers - trip.start_kilometers} km
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      trip.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 
                      trip.approval_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trip.approval_status}
                    </div>
                  </div>
                ))}
                <div className="text-center mt-2">
                  <Link to="/trips" className="text-sm text-blue-600 hover:underline">
                    View all trips
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No recent trips recorded</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Certifications</CardTitle>
            <CardDescription>Certifications expiring soon</CardDescription>
          </CardHeader>
          <CardContent>
            {driverTrainings && driverTrainings.filter(t => t.expiry_date).length > 0 ? (
              <div className="space-y-4">
                {driverTrainings
                  .filter(t => t.expiry_date)
                  .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
                  .slice(0, 3)
                  .map((training) => (
                    <div key={training.id} className="flex items-center border-b pb-2">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{training.course?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(training.expiry_date!), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        isExpiringWithin(training.expiry_date!, 30) ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isExpiringWithin(training.expiry_date!, 30) ? 'Expiring soon' : 'Valid'}
                      </div>
                    </div>
                  ))}
                <div className="text-center mt-2">
                  <Link to="/driver/trainings" className="text-sm text-blue-600 hover:underline">
                    View all certifications
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming certification expirations</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function isExpiringWithin(dateStr: string, days: number): boolean {
  const expiryDate = new Date(dateStr);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry > 0 && daysUntilExpiry <= days;
}
