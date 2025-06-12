
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Users, 
  Car, 
  FileText, 
  Settings, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  action: () => void;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

export function CompanyManagementWorkflow() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const { data: companyStats } = useQuery({
    queryKey: ['company-setup-stats', profile?.get()?.company_id],
    queryFn: async () => {
      const companyId = profile?.get()?.company_id;
      if (!companyId) return null;
      
      const [vehiclesResult, driversResult, documentsResult] = await Promise.all([
        supabase.from('vehicles').select('id').eq('company_id', companyId),
        supabase.from('drivers').select('id').eq('company_id', companyId),
        supabase.from('documents').select('id').eq('company_id', companyId)
      ]);
      
      return {
        vehicleCount: vehiclesResult.data?.length || 0,
        driverCount: driversResult.data?.length || 0,
        documentCount: documentsResult.data?.length || 0
      };
    },
    enabled: !!profile?.get()?.company_id
  });

  const getWorkflowSteps = (): WorkflowStep[] => [
    {
      id: 'company_setup',
      title: 'Company Profile Setup',
      description: 'Complete your company profile and branding',
      status: 'completed', // Assume completed if user has company_id
      action: () => navigate('/settings'),
      icon: <Building className="h-5 w-5" />,
      priority: 'high'
    },
    {
      id: 'add_vehicles',
      title: 'Add Fleet Vehicles',
      description: `${companyStats?.vehicleCount || 0} vehicles added`,
      status: (companyStats?.vehicleCount || 0) > 0 ? 'completed' : 'pending',
      action: () => navigate('/fleet'),
      icon: <Car className="h-5 w-5" />,
      priority: 'high'
    },
    {
      id: 'invite_users',
      title: 'Invite Team Members',
      description: `${companyStats?.driverCount || 0} team members added`,
      status: (companyStats?.driverCount || 0) > 0 ? 'completed' : 'pending',
      action: () => navigate('/users'),
      icon: <Users className="h-5 w-5" />,
      priority: 'high'
    },
    {
      id: 'upload_documents',
      title: 'Upload Documents',
      description: `${companyStats?.documentCount || 0} documents uploaded`,
      status: (companyStats?.documentCount || 0) > 0 ? 'completed' : 'pending',
      action: () => navigate('/documents'),
      icon: <FileText className="h-5 w-5" />,
      priority: 'medium'
    },
    {
      id: 'setup_analytics',
      title: 'Configure Analytics',
      description: 'Set up reporting and analytics dashboards',
      status: 'pending',
      action: () => navigate('/reports'),
      icon: <BarChart3 className="h-5 w-5" />,
      priority: 'medium'
    },
    {
      id: 'system_settings',
      title: 'System Configuration',
      description: 'Configure advanced system settings',
      status: 'pending',
      action: () => navigate('/settings'),
      icon: <Settings className="h-5 w-5" />,
      priority: 'low'
    }
  ];

  const steps = getWorkflowSteps();
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Company Setup Progress</h2>
        <p className="text-muted-foreground mb-4">
          Complete these steps to get your fleet management system ready
        </p>
        <div className="max-w-md mx-auto">
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {completedSteps} of {steps.length} steps completed ({Math.round(progress)}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step) => (
          <Card 
            key={step.id} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              step.status === 'completed' ? 'border-green-200 bg-green-50/50' : ''
            }`}
            onClick={step.action}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step.icon}
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
                {getStatusIcon(step.status)}
              </div>
              <div className="flex items-center justify-between">
                <CardDescription className="flex-1">{step.description}</CardDescription>
                <div className="ml-2">
                  {getPriorityBadge(step.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant={step.status === 'completed' ? 'outline' : 'default'} 
                className="w-full"
                size="sm"
              >
                {step.status === 'completed' ? 'Review' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
