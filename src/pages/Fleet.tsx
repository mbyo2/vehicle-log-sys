
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { VehicleList } from '@/components/vehicle/VehicleList';
import { EnhancedVehicleForm } from '@/components/vehicle/EnhancedVehicleForm';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function Fleet() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const userRole = profile.get()?.role;
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleAddSuccess = () => {
    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${isMobile ? 'text-center w-full' : ''}`}>
              Vehicle Fleet Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your company's vehicle fleet and assignments
            </p>
          </div>
          
          {(userRole === 'company_admin' || userRole === 'super_admin') && (
            <Button onClick={() => setShowAddForm(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          )}
        </div>
        
        <VehicleList key={refreshTrigger} />

        {/* Add Vehicle Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <EnhancedVehicleForm
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
