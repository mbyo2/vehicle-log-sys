import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionReadiness } from "@/components/onboarding/ProductionReadiness";
import { DeploymentGuide } from "@/components/onboarding/DeploymentGuide";
import { UserManagement } from "@/pages/UserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Setup() {
  const { profile } = useAuth();
  const currentProfile = profile.get();
  const isSuperAdmin = currentProfile?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section is only accessible to super administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Setup</h1>
          <p className="text-muted-foreground">
            Configure your fleet management system for production use.
          </p>
        </div>

        <Tabs defaultValue="readiness" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="readiness">Production Readiness</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="readiness" className="space-y-4">
            <ProductionReadiness />
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            <DeploymentGuide />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}