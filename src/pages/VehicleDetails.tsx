
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';

import { VehicleAssignmentManager } from '@/components/vehicle/VehicleAssignmentManager';
import { EnhancedVehicleForm } from '@/components/vehicle/EnhancedVehicleForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Edit, Car, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const userRole = profile.get()?.role;

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          assigned_profile:profiles(full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error: any) {
      console.error('Error fetching vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vehicle details"
      });
      navigate('/fleet');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchVehicle();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-8">
          <p className="text-muted-foreground">Vehicle not found</p>
          <Button onClick={() => navigate('/fleet')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fleet
          </Button>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/fleet')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fleet
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{vehicle.plate_number}</h1>
              <p className="text-muted-foreground">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </p>
            </div>
          </div>
          
          {(userRole === 'company_admin' || userRole === 'super_admin') && (
            <Button onClick={() => setShowEditForm(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Vehicle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-medium">{vehicle.make}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Kilometers</p>
                  <p className="font-medium">{vehicle.current_kilometers?.toLocaleString() || 'N/A'} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Interval</p>
                  <p className="font-medium">{vehicle.service_interval?.toLocaleString() || 'N/A'} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Service</p>
                  <p className="font-medium">{vehicle.last_service_kilometers?.toLocaleString() || 'N/A'} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Fitness Certificate</span>
                {vehicle.fitness_cert_expiry ? (
                  <Badge variant="outline">
                    Expires: {format(new Date(vehicle.fitness_cert_expiry), 'MMM dd, yyyy')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not set</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Road Tax</span>
                {vehicle.road_tax_expiry ? (
                  <Badge variant="outline">
                    Expires: {format(new Date(vehicle.road_tax_expiry), 'MMM dd, yyyy')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not set</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Insurance</span>
                {vehicle.insurance_expiry ? (
                  <Badge variant="outline">
                    Expires: {format(new Date(vehicle.insurance_expiry), 'MMM dd, yyyy')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not set</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Assignment */}
          <div className="lg:col-span-2">
            <VehicleAssignmentManager 
              vehicle={vehicle} 
              onAssignmentUpdated={fetchVehicle}
            />
          </div>
        </div>

        {/* Edit Vehicle Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Vehicle</DialogTitle>
            </DialogHeader>
            <EnhancedVehicleForm
              vehicle={vehicle}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
