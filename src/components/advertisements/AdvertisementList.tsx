import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { format } from "date-fns";

export function AdvertisementList() {
  const { advertisements, isLoading } = useAdvertisements();

  if (isLoading) {
    return <div>Loading advertisements...</div>;
  }

  return (
    <div className="space-y-4">
      {advertisements?.map((ad) => (
        <Card key={ad.id}>
          <CardHeader>
            <CardTitle>{ad.title}</CardTitle>
            <CardDescription>
              Valid from {format(new Date(ad.start_date), "PPP")} to{" "}
              {format(new Date(ad.end_date), "PPP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{ad.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}