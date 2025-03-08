
import { DriverTraining } from "@/types/training";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Download, Calendar, Clock, FileText, FileCheck } from "lucide-react";

interface TrainingDetailsProps {
  training: DriverTraining;
}

export function TrainingDetails({ training }: TrainingDetailsProps) {
  const expiryStatus = getExpiryStatus(training.expiry_date);
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{training.course?.title}</h2>
        <p className="text-sm text-muted-foreground">{training.course?.description}</p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Completion Date</p>
              <p className="font-medium">{format(new Date(training.completion_date), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
          
          {training.expiry_date && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className={`font-medium ${
                  expiryStatus.variant === 'destructive' ? 'text-red-600' :
                  expiryStatus.variant === 'warning' ? 'text-amber-600' : ''
                }`}>
                  {format(new Date(training.expiry_date), 'MMMM dd, yyyy')} 
                  {expiryStatus.variant !== 'success' && ` (${expiryStatus.label})`}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <FileCheck className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`font-medium ${
                expiryStatus.variant === 'destructive' ? 'text-red-600' :
                expiryStatus.variant === 'warning' ? 'text-amber-600' :
                'text-green-600'
              }`}>
                {expiryStatus.label}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {training.certificate_number && (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Certificate Number</p>
                <p className="font-medium">{training.certificate_number}</p>
              </div>
            </div>
          )}
          
          {training.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{training.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      {training.certificate_file_path && (
        <div className="mt-4">
          <Button className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
        </div>
      )}
    </div>
  );
}

function getExpiryStatus(expiry_date?: string) {
  if (!expiry_date) return { label: "No Expiry", variant: "outline" as const };
  
  const expiryDate = new Date(expiry_date);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) {
    return { label: "Expired", variant: "destructive" as const };
  } else if (daysUntilExpiry <= 30) {
    return { label: `Expires in ${daysUntilExpiry} days`, variant: "warning" as const };
  } else {
    return { label: "Valid", variant: "success" as const };
  }
}
