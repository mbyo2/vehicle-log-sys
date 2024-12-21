import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, FileText, Bell } from "lucide-react";
import { ModalDemo } from "@/components/ModalDemo";

export function Dashboard() {
  const { profile } = useAuth();

  const stats = {
    driver: [
      { name: 'Total Trips', value: '0', icon: Car },
      { name: 'Total Distance', value: '0 km', icon: FileText },
      { name: 'Active Vehicles', value: '0', icon: Car },
      { name: 'Notifications', value: '0', icon: Bell },
    ],
    supervisor: [
      { name: 'Active Drivers', value: '0', icon: Users },
      { name: 'Pending Approvals', value: '0', icon: FileText },
      { name: 'Active Vehicles', value: '0', icon: Car },
      { name: 'Maintenance Alerts', value: '0', icon: Bell },
    ],
    admin: [
      { name: 'Total Users', value: '0', icon: Users },
      { name: 'Total Vehicles', value: '0', icon: Car },
      { name: 'Monthly Trips', value: '0', icon: FileText },
      { name: 'System Alerts', value: '0', icon: Bell },
    ],
  };

  const userStats = profile ? stats[profile.role] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modal System Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <ModalDemo />
        </CardContent>
      </Card>
    </div>
  );
}