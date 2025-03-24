
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, Filter, MapPin, Plus, RefreshCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { useIsMobile } from '@/hooks/useIsMobile';

export function Trips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const userProfile = profile.get();
      
      if (!userProfile) {
        setTrips([]);
        setLoading(false);
        return;
      }
      
      // Different queries based on user role
      let query = supabase
        .from('trip_logs')
        .select(`
          *,
          vehicles:vehicle_id (plate_number, make, model),
          profiles:driver_id (full_name)
        `)
        .order('start_time', { ascending: false });
        
      // Apply company filter for company admins and supervisors
      if (userProfile.role === 'company_admin' || userProfile.role === 'supervisor') {
        if (!userProfile.company_id) {
          setTrips([]);
          setLoading(false);
          return;
        }
        
        // Get all trips for this company
        const { data: companyVehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('company_id', userProfile.company_id);
          
        if (companyVehicles && companyVehicles.length > 0) {
          query = query.in('vehicle_id', companyVehicles.map(v => v.id));
        } else {
          setTrips([]);
          setLoading(false);
          return;
        }
      }
      
      // For drivers, only show their own trips
      if (userProfile.role === 'driver') {
        // Find driver id for this profile
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('profile_id', userProfile.id)
          .single();
          
        if (driverData) {
          query = query.eq('driver_id', driverData.id);
        } else {
          setTrips([]);
          setLoading(false);
          return;
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setTrips(data || []);
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load trip data",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const userProfile = profile.get();
      
      if (!userProfile?.company_id) {
        setVehicles([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate_number, make, model')
        .eq('company_id', userProfile.company_id);
        
      if (error) throw error;
      
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleNewTrip = () => {
    navigate('/trips/new');
  };

  const handleRefresh = () => {
    fetchTrips();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedStatus([]);
  };

  const filteredTrips = trips.filter(trip => {
    // Apply search filter
    const vehicleMatch = trip.vehicles?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.vehicles?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.vehicles?.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const purposeMatch = trip.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = (!startDate || new Date(trip.start_time) >= startDate) && 
                     (!endDate || new Date(trip.start_time) <= endDate);
    
    const statusMatch = selectedStatus.length === 0 || selectedStatus.includes(trip.approval_status);
    
    return (vehicleMatch || purposeMatch) && dateMatch && statusMatch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h1 className={`text-2xl md:text-3xl font-bold ${isMobile ? 'text-center' : ''}`}>
            Trip Logs
          </h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button onClick={handleNewTrip} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Log New Trip</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-80"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  {(!!startDate || !!endDate || selectedStatus.length > 0) && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {(!!startDate ? 1 : 0) + (!!endDate ? 1 : 0) + (selectedStatus.length > 0 ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Date Range</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          className="p-0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          className="p-0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'approved', 'rejected'].map(status => (
                        <Badge
                          key={status}
                          variant={selectedStatus.includes(status) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedStatus.includes(status)) {
                              setSelectedStatus(selectedStatus.filter(s => s !== status));
                            } else {
                              setSelectedStatus([...selectedStatus, status]);
                            }
                          }}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {(!!startDate || !!endDate || selectedStatus.length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={resetFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <CardTitle className="text-lg">
                      {trip.purpose}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        trip.approval_status === 'approved' ? 'success' : 
                        trip.approval_status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {trip.approval_status.charAt(0).toUpperCase() + trip.approval_status.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(trip.start_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Time
                      </h4>
                      <p className="text-sm">
                        {new Date(trip.start_time).toLocaleTimeString()} - {new Date(trip.end_time).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        Distance
                      </h4>
                      <p className="text-sm">
                        {trip.start_kilometers} - {trip.end_kilometers} km ({trip.end_kilometers - trip.start_kilometers} km total)
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Vehicle</h4>
                      <p className="text-sm">
                        {trip.vehicles?.plate_number} ({trip.vehicles?.make} {trip.vehicles?.model})
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Driver</h4>
                      <p className="text-sm">
                        {trip.profiles?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {trip.comments && (
                    <div className="mt-4 text-sm">
                      <h4 className="font-medium">Comments</h4>
                      <p className="text-muted-foreground">{trip.comments}</p>
                    </div>
                  )}
                  
                  {trip.approval_comment && (
                    <div className="mt-4 text-sm p-3 bg-muted rounded-md">
                      <h4 className="font-medium">Approval Comments</h4>
                      <p className="text-muted-foreground">{trip.approval_comment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No trip logs found</p>
            <Button onClick={handleNewTrip}>
              <Plus className="h-4 w-4 mr-2" />
              Log New Trip
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
