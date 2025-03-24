
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Car, Clock, FilterIcon, Plus, Search, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/useIsMobile';

export function VehicleList() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const userProfile = profile.get();
      
      if (!userProfile?.company_id) {
        setVehicles([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          service_bookings:service_bookings(id, status, booking_date, service_type),
          vehicle_logs:trip_logs(id, start_time, end_time, approval_status)
        `)
        .eq('company_id', userProfile.company_id);
      
      if (error) {
        throw error;
      }
      
      // Process vehicle data to add status indicators
      const processedVehicles = data.map(vehicle => {
        // Check for upcoming service bookings
        const upcomingService = vehicle.service_bookings?.find((booking: any) => 
          booking.status === 'pending' || booking.status === 'scheduled'
        );
        
        // Check for documents nearing expiry
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        // Check if any important documents are expiring soon
        const insuranceExpiry = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) : null;
        const roadTaxExpiry = vehicle.road_tax_expiry ? new Date(vehicle.road_tax_expiry) : null;
        const finessCertExpiry = vehicle.fitness_cert_expiry ? new Date(vehicle.fitness_cert_expiry) : null;
        
        const hasExpiringDocs = (
          (insuranceExpiry && insuranceExpiry <= thirtyDaysFromNow) ||
          (roadTaxExpiry && roadTaxExpiry <= thirtyDaysFromNow) ||
          (finessCertExpiry && finessCertExpiry <= thirtyDaysFromNow)
        );
        
        // Check if vehicle needs service based on kilometers and service interval
        const needsService = vehicle.current_kilometers && vehicle.service_interval ? 
          (vehicle.current_kilometers % vehicle.service_interval) >= (vehicle.service_interval * 0.9) : 
          false;
        
        // Determine status
        let status = 'available';
        if (needsService || upcomingService) {
          status = 'maintenance';
        }
        if (hasExpiringDocs) {
          status = 'attention';
        }
        
        return {
          ...vehicle,
          status,
          hasExpiringDocs,
          needsService,
          upcomingService
        };
      });
      
      setVehicles(processedVehicles);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading vehicles",
        description: error.message || "Failed to load vehicle list"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'maintenance':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Maintenance Due</Badge>;
      case 'attention':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Attention Required</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Available</Badge>;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    // Apply search filter
    const matchesSearch = (
      vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply status filter if any are selected
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(vehicle.status);
    
    return matchesSearch && matchesStatus;
  });

  const handleAddVehicle = () => {
    navigate('/fleet/add');
  };

  const handleVehicleClick = (id: string) => {
    navigate(`/fleet/${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full sm:w-80"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                <span>Filter</span>
                {filterStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {filterStatus.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={filterStatus.includes('available')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterStatus([...filterStatus, 'available']);
                        } else {
                          setFilterStatus(filterStatus.filter(s => s !== 'available'));
                        }
                      }}
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="maintenance"
                      checked={filterStatus.includes('maintenance')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterStatus([...filterStatus, 'maintenance']);
                        } else {
                          setFilterStatus(filterStatus.filter(s => s !== 'maintenance'));
                        }
                      }}
                    />
                    <Label htmlFor="maintenance">Maintenance Due</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="attention"
                      checked={filterStatus.includes('attention')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterStatus([...filterStatus, 'attention']);
                        } else {
                          setFilterStatus(filterStatus.filter(s => s !== 'attention'));
                        }
                      }}
                    />
                    <Label htmlFor="attention">Attention Required</Label>
                  </div>
                </div>
                {filterStatus.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setFilterStatus([])}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleAddVehicle} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card 
              key={vehicle.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleVehicleClick(vehicle.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{vehicle.plate_number}</CardTitle>
                  {getStatusBadge(vehicle.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      Odometer
                    </span>
                    <span className="font-medium">{vehicle.current_kilometers?.toLocaleString() || 0} km</span>
                  </div>
                  
                  {vehicle.needsService && (
                    <div className="flex items-center text-yellow-700 bg-yellow-50 p-2 rounded text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Service due soon ({vehicle.service_interval - (vehicle.current_kilometers % vehicle.service_interval)} km remaining)
                    </div>
                  )}
                  
                  {vehicle.upcomingService && (
                    <div className="flex items-center text-blue-700 bg-blue-50 p-2 rounded text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {vehicle.upcomingService.service_type} scheduled on {new Date(vehicle.upcomingService.booking_date).toLocaleDateString()}
                    </div>
                  )}
                  
                  {vehicle.hasExpiringDocs && (
                    <div className="flex items-center text-red-700 bg-red-50 p-2 rounded text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Documents expiring soon
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No vehicles found</p>
          <Button onClick={handleAddVehicle}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Vehicle
          </Button>
        </Card>
      )}
    </div>
  );
}
