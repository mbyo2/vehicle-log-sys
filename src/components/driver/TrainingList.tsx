
import { useState } from "react";
import { useTrainings } from "@/hooks/useTrainings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileCheck,
  AlertTriangle,
  FileX,
  Download,
  Eye,
  Calendar,
  CertificateIcon
} from "lucide-react";
import { format } from "date-fns";
import { TrainingDetails } from "./TrainingDetails";
import { DriverTraining } from "@/types/training";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Custom component for Certificate icon since it's not in lucide
function CertificateIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

export function TrainingList() {
  const { driverTrainings, isLoading } = useTrainings();
  const [selectedTraining, setSelectedTraining] = useState<DriverTraining | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Group trainings by status
  const validTrainings = driverTrainings?.filter(t => {
    if (!t.expiry_date) return true; // No expiry date means always valid
    return new Date(t.expiry_date) > new Date();
  });
  
  const expiredTrainings = driverTrainings?.filter(t => {
    if (!t.expiry_date) return false;
    return new Date(t.expiry_date) <= new Date();
  });
  
  const expiringSoonTrainings = driverTrainings?.filter(t => {
    if (!t.expiry_date) return false;
    const expiryDate = new Date(t.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  const handleViewTraining = (training: DriverTraining) => {
    setSelectedTraining(training);
    setIsViewOpen(true);
  };

  const getExpiryStatus = (expiry_date?: string) => {
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
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-60">Loading trainings...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Certifications</h1>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center">
            <CertificateIcon className="mr-2 h-4 w-4" />
            All ({driverTrainings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="valid" className="flex items-center">
            <FileCheck className="mr-2 h-4 w-4" />
            Valid ({validTrainings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Expiring Soon ({expiringSoonTrainings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center">
            <FileX className="mr-2 h-4 w-4" />
            Expired ({expiredTrainings?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <TrainingTable 
                trainings={driverTrainings || []} 
                onView={handleViewTraining} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="valid">
          <Card>
            <CardHeader>
              <CardTitle>Valid Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <TrainingTable 
                trainings={validTrainings || []} 
                onView={handleViewTraining} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>Certifications Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <TrainingTable 
                trainings={expiringSoonTrainings || []} 
                onView={handleViewTraining} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Expired Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <TrainingTable 
                trainings={expiredTrainings || []} 
                onView={handleViewTraining} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Certification Details</DialogTitle>
          </DialogHeader>
          {selectedTraining && <TrainingDetails training={selectedTraining} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TrainingTableProps {
  trainings: DriverTraining[];
  onView: (training: DriverTraining) => void;
}

function TrainingTable({ trainings, onView }: TrainingTableProps) {
  if (trainings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No certifications found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Certification</TableHead>
          <TableHead>Completion Date</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trainings.map((training) => {
          const status = getExpiryStatus(training.expiry_date);
          
          return (
            <TableRow key={training.id}>
              <TableCell className="font-medium">{training.course?.title}</TableCell>
              <TableCell>{format(new Date(training.completion_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                {training.expiry_date 
                  ? format(new Date(training.expiry_date), 'MMM dd, yyyy')
                  : "No expiry"}
              </TableCell>
              <TableCell>
                <Badge variant={
                  status.variant === 'success' ? 'outline' :
                  status.variant === 'warning' ? 'outline' :
                  'outline'
                }
                className={
                  status.variant === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                  status.variant === 'warning' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                  status.variant === 'destructive' ? 'bg-red-50 text-red-600 border-red-200' :
                  ''
                }>
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onView(training)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {training.certificate_file_path && (
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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
