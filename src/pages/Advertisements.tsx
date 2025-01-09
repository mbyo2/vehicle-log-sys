import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdPlacement } from "@/components/advertisements/AdPlacement";
import { AdPurchaseForm } from "@/components/advertisements/AdPurchaseForm";
import { AdAnalytics } from "@/components/advertisements/AdAnalytics";
import { useAuth } from "@/contexts/AuthContext";

export function Advertisements() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("view");

  const isAdvertiser = profile?.role === 'super_admin' || profile?.role === 'company_admin';

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Advertisements</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="view">View Ads</TabsTrigger>
          {isAdvertiser && (
            <>
              <TabsTrigger value="purchase">Purchase Ad Space</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="view">
          <AdPlacement />
        </TabsContent>

        {isAdvertiser && (
          <>
            <TabsContent value="purchase">
              <AdPurchaseForm />
            </TabsContent>

            <TabsContent value="analytics">
              <AdAnalytics />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}