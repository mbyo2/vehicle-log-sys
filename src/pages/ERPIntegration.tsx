import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ERPIntegrationForm } from "@/components/integrations/ERPIntegrationForm";

export function ERPIntegration() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>ERP Integration</CardTitle>
          <CardDescription>
            Configure your ERP system integration to sync vehicle logs and maintenance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ERPIntegrationForm />
        </CardContent>
      </Card>
    </div>
  );
}