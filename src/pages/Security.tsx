import { SecuritySettings } from "@/components/security/SecuritySettings";
import { EnhancedSecurityDashboard } from "@/components/security/EnhancedSecurityDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleManagement } from "@/hooks/useRoleManagement";

export function Security() {
  const { isAdminOrAbove } = useRoleManagement();

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
          {isAdminOrAbove() && (
            <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="settings" className="mt-6">
          <SecuritySettings />
        </TabsContent>
        
        {isAdminOrAbove() && (
          <TabsContent value="dashboard" className="mt-6">
            <EnhancedSecurityDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}