import { useEffect } from 'react';
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { SecuritySettings } from "@/components/security/SecuritySettings";
import { EnhancedSecurityDashboard } from "@/components/security/EnhancedSecurityDashboard";
import { SecurityMonitoringDashboard } from "@/components/security/SecurityMonitoringDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Security() {
  useEffect(() => {
    document.title = "Security | Fleet Management";
  }, []);

  return (
    <RoleBasedRoute 
      allowedRoles={['super_admin', 'company_admin']}
      fallbackPath="/dashboard"
    >
      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
            <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
            <TabsTrigger value="enhanced">Enhanced Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <SecurityDashboard />
          </TabsContent>
          
          <TabsContent value="monitoring" className="mt-6">
            <SecurityMonitoringDashboard />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <SecuritySettings />
          </TabsContent>
          
          <TabsContent value="enhanced" className="mt-6">
            <EnhancedSecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </RoleBasedRoute>
  );
}