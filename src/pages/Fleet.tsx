
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { VehicleList } from '@/components/vehicle/VehicleList';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';

export function Fleet() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const userRole = profile.get()?.role;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className={`text-2xl md:text-3xl font-bold ${isMobile ? 'text-center w-full' : ''}`}>
            Vehicle Fleet
          </h1>
        </div>
        
        <VehicleList />
      </div>
    </DashboardLayout>
  );
}
