import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ServiceHistoryDetailsProps {
  service: any; // TODO: Add proper typing
}

export function ServiceHistoryDetails({ service }: ServiceHistoryDetailsProps) {
  const totalPartsCost = service.maintenance_parts?.reduce(
    (acc: number, part: any) => acc + (part.quantity_used * part.unit_cost),
    0
  ) || 0;

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>
            Performed on {service.vehicles?.plate_number} - {service.vehicles?.make} {service.vehicles?.model}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Description</h4>
              <p className="text-sm text-muted-foreground">{service.description || 'No description provided'}</p>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Parts Used</h4>
              {service.maintenance_parts && service.maintenance_parts.length > 0 ? (
                <div className="space-y-2">
                  {service.maintenance_parts.map((part: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {part.parts_inventory.part_name} ({part.parts_inventory.part_number})
                        x{part.quantity_used}
                      </span>
                      <span>${part.quantity_used * part.unit_cost}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Parts Cost</span>
                    <span>${totalPartsCost}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No parts recorded for this service</p>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-medium">
              <span>Total Service Cost</span>
              <span>${service.cost}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}