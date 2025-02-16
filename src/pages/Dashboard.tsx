
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function Dashboard() {
  const { profile } = useAuth();

  const getRoleSpecificContent = () => {
    const userRole = profile.get()?.role;
    
    switch (userRole) {
      case 'super_admin':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Total Companies</h3>
              <p>Coming soon...</p>
            </Card>
          </div>
        );
      
      case 'company_admin':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Total Vehicles</h3>
              <p>Coming soon...</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Active Drivers</h3>
              <p>Coming soon...</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Pending Approvals</h3>
              <p>Coming soon...</p>
            </Card>
          </div>
        );
      
      case 'supervisor':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Assigned Vehicles</h3>
              <p>Coming soon...</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Pending Trip Approvals</h3>
              <p>Coming soon...</p>
            </Card>
          </div>
        );
      
      case 'driver':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">My Vehicle</h3>
              <p>Coming soon...</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Recent Trips</h3>
              <p>Coming soon...</p>
            </Card>
          </div>
        );
      
      default:
        return <p>Loading...</p>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Welcome, {profile.get()?.full_name || 'User'}
        </h1>
        {getRoleSpecificContent()}
      </div>
    </DashboardLayout>
  );
}
