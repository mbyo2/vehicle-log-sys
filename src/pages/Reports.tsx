import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Gauge, DollarSign, CreditCard } from "lucide-react";

export function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>

      <Tabs defaultValue="consumption" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumption">
            <Fuel className="h-4 w-4 mr-2" />
            Fuel Consumption
          </TabsTrigger>
          <TabsTrigger value="efficiency">
            <Gauge className="h-4 w-4 mr-2" />
            Efficiency Analysis
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="h-4 w-4 mr-2" />
            Cost Reports
          </TabsTrigger>
          <TabsTrigger value="cards">
            <CreditCard className="h-4 w-4 mr-2" />
            Fuel Cards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Consumption Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fuel consumption tracking interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Efficiency Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fuel efficiency analysis interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Cost Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fuel cost reporting interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Card Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fuel card management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}