import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Progress } from "@/components/ui/progress";

export const ComplianceStatusDashboard = () => {
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles-compliance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          documents(
            id,
            verification_status,
            type
          )
        `);
      if (error) throw error;
      return data;
    },
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  if (vehiclesLoading || documentsLoading) return <div>Loading...</div>;

  const getExpiryStatus = (date: string | null) => {
    if (!date) return { status: 'missing', days: 0 };
    const days = differenceInDays(new Date(date), new Date());
    return {
      status: days < 0 ? 'expired' : days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'valid',
      days,
    };
  };

  const calculateComplianceScore = () => {
    if (!vehicles) return 0;
    let totalChecks = vehicles.length * 3; // 3 checks per vehicle: insurance, road tax, fitness cert
    let passedChecks = 0;

    vehicles.forEach(vehicle => {
      const insuranceStatus = getExpiryStatus(vehicle.insurance_expiry);
      const roadTaxStatus = getExpiryStatus(vehicle.road_tax_expiry);
      const fitnessStatus = getExpiryStatus(vehicle.fitness_cert_expiry);

      if (insuranceStatus.status === 'valid') passedChecks++;
      if (roadTaxStatus.status === 'valid') passedChecks++;
      if (fitnessStatus.status === 'valid') passedChecks++;
    });

    return Math.round((passedChecks / totalChecks) * 100);
  };

  const getDocumentStats = () => {
    if (!documents) return { pending: 0, approved: 0, rejected: 0 };
    return documents.reduce((acc, doc) => {
      acc[doc.verification_status]++;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });
  };

  const complianceScore = calculateComplianceScore();
  const documentStats = getDocumentStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{complianceScore}%</span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{documentStats.approved}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {documentStats.pending} pending • {documentStats.rejected} rejected
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {vehicles?.filter(v => {
                  const insuranceStatus = getExpiryStatus(v.insurance_expiry);
                  const roadTaxStatus = getExpiryStatus(v.road_tax_expiry);
                  const fitnessStatus = getExpiryStatus(v.fitness_cert_expiry);
                  return insuranceStatus.status === 'warning' || 
                         roadTaxStatus.status === 'warning' || 
                         fitnessStatus.status === 'warning';
                }).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">
                {vehicles?.filter(v => {
                  const insuranceStatus = getExpiryStatus(v.insurance_expiry);
                  const roadTaxStatus = getExpiryStatus(v.road_tax_expiry);
                  const fitnessStatus = getExpiryStatus(v.fitness_cert_expiry);
                  return insuranceStatus.status === 'expired' || 
                         roadTaxStatus.status === 'expired' || 
                         fitnessStatus.status === 'expired' ||
                         insuranceStatus.status === 'critical' || 
                         roadTaxStatus.status === 'critical' || 
                         fitnessStatus.status === 'critical';
                }).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Critical Compliance Issues</h3>
        {vehicles?.map((vehicle) => {
          const insuranceStatus = getExpiryStatus(vehicle.insurance_expiry);
          const roadTaxStatus = getExpiryStatus(vehicle.road_tax_expiry);
          const fitnessStatus = getExpiryStatus(vehicle.fitness_cert_expiry);

          if (insuranceStatus.status === 'valid' && 
              roadTaxStatus.status === 'valid' && 
              fitnessStatus.status === 'valid') {
            return null;
          }

          return (
            <Alert 
              key={vehicle.id}
              variant={
                insuranceStatus.status === 'expired' || 
                roadTaxStatus.status === 'expired' || 
                fitnessStatus.status === 'expired' 
                  ? 'destructive' 
                  : 'default'
              }
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{vehicle.plate_number}</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  {insuranceStatus.status !== 'valid' && (
                    <div>
                      Insurance: {insuranceStatus.status === 'expired' 
                        ? 'Expired' 
                        : `Expires in ${insuranceStatus.days} days`}
                    </div>
                  )}
                  {roadTaxStatus.status !== 'valid' && (
                    <div>
                      Road Tax: {roadTaxStatus.status === 'expired' 
                        ? 'Expired' 
                        : `Expires in ${roadTaxStatus.days} days`}
                    </div>
                  )}
                  {fitnessStatus.status !== 'valid' && (
                    <div>
                      Fitness Certificate: {fitnessStatus.status === 'expired' 
                        ? 'Expired' 
                        : `Expires in ${fitnessStatus.days} days`}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    </div>
  );
};