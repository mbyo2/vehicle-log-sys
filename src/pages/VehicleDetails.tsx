import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceScheduler } from '@/components/vehicle/MaintenanceScheduler';
import { ServiceStatus } from '@/components/vehicle/ServiceStatus';
import { MaintenanceList } from '@/components/vehicle/MaintenanceList';
import { VehicleDocuments } from '@/components/vehicle/VehicleDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle } from '@/types/vehicle';

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  useEffect(() => {
    if (id) {
      fetchVehicleDetails();
    }
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          service_bookings:service_bookings(id, service_type, booking_date, status, notes),
          trip_logs:trip_logs(id, start_time, end_time, start_kilometers, end_kilometers, purpose),
          vehicle_services:vehicle_services(id, service_type, service_date, cost, kilometers, description)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setVehicle(data);
    } catch (error: any) {
      console.error('Error fetching vehicle details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vehicle details",
      });
      navigate('/fleet');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/fleet/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Vehicle Deleted",
        description: "The vehicle has been successfully deleted",
      });
      
      navigate('/fleet');
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete vehicle",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleNewTrip = () => {
    navigate(`/trips/new/${id}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout>
        <Card className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium">Vehicle Not Found</h3>
            <p className="text-muted-foreground mt-2">The requested vehicle could not be found.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/fleet')}
            >
              Return to Fleet
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const currentCompanyId = profile.get()?.company_id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold mb-1 ${isMobile ? 'text-center' : ''}`}>
              {vehicle.plate_number}
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-center' : ''}`}>
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-2">
            <Button onClick={handleNewTrip} className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span>Log Trip</span>
            </Button>
            <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 text-red-500 hover:text-red-600">
                  <Trash className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {vehicle.plate_number} and all associated data.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details" className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center gap-1">
              <Map className="h-4 w-4" />
              <span>Trip Logs</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="font-medium">Plate Number</dt>
                      <dd>{vehicle.plate_number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Make</dt>
                      <dd>{vehicle.make}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Model</dt>
                      <dd>{vehicle.model}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Year</dt>
                      <dd>{vehicle.year}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Current Kilometers</dt>
                      <dd>{vehicle.current_kilometers?.toLocaleString() || 0} km</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Service Interval</dt>
                      <dd>{vehicle.service_interval?.toLocaleString() || 5000} km</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between items-center">
                      <dt className="font-medium">Insurance Expiry</dt>
                      <dd className="flex items-center gap-2">
                        {formatDate(vehicle.insurance_expiry)}
                        {vehicle.insurance_expiry && new Date(vehicle.insurance_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Expiring Soon
                          </Badge>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="font-medium">Road Tax Expiry</dt>
                      <dd className="flex items-center gap-2">
                        {formatDate(vehicle.road_tax_expiry)}
                        {vehicle.road_tax_expiry && new Date(vehicle.road_tax_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Expiring Soon
                          </Badge>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="font-medium">Fitness Certificate Expiry</dt>
                      <dd className="flex items-center gap-2">
                        {formatDate(vehicle.fitness_cert_expiry)}
                        {vehicle.fitness_cert_expiry && new Date(vehicle.fitness_cert_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Expiring Soon
                          </Badge>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Next Service Due</dt>
                      <dd>
                        {vehicle.current_kilometers && vehicle.service_interval ? 
                          `At ${(Math.floor(vehicle.current_kilometers / vehicle.service_interval) + 1) * vehicle.service_interval} km` :
                          'Not set'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="maintenance">
            <MaintenanceList vehicle={vehicle as Vehicle} />
          </TabsContent>
          
          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {vehicle.trip_logs && vehicle.trip_logs.length > 0 ? (
                  <div className="space-y-4">
                    {vehicle.trip_logs
                      .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                      .map((trip: any) => (
                        <div key={trip.id} className="border rounded p-4">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-medium">{trip.purpose}</h3>
                            <span className="text-sm text-muted-foreground">
                              {new Date(trip.start_time).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start:</span> {new Date(trip.start_time).toLocaleTimeString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">End:</span> {new Date(trip.end_time).toLocaleTimeString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Start KM:</span> {trip.start_kilometers}
                            </div>
                            <div>
                              <span className="text-muted-foreground">End KM:</span> {trip.end_kilometers}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Distance:</span> {trip.end_kilometers - trip.start_kilometers} km
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No trip logs found for this vehicle</p>
                    <Button onClick={handleNewTrip}>Log New Trip</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <VehicleDocuments vehicleId={id || ''} companyId={currentCompanyId || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
