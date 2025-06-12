
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent,  CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Car, FileText, Calendar, Settings, BarChart3 } from 'lucide-react';
import { CompanyManagementWorkflow } from '@/components/company/CompanyManagementWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CompanyAdminWorkflow() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Fleet Management',
      description: 'Manage your company vehicles and assignments',
      icon: Car,
      action: () => navigate('/fleet'),
      primary: true
    },
    {
      title: 'User Management',
      description: 'Add and manage company users (supervisors, drivers)',
      icon: Users,
      action: () => navigate('/users'),
      primary: true
    },
    {
      title: 'Service Bookings',
      description: 'Schedule and manage vehicle maintenance',
      icon: Calendar,
      action: () => navigate('/service-bookings')
    },
    {
      title: 'Reports & Analytics',
      description: 'View company performance and analytics',
      icon: BarChart3,
      action: () => navigate('/reports')
    },
    {
      title: 'Documents',
      description: 'Manage company and vehicle documents',
      icon: FileText,
      action: () => navigate('/documents')
    },
    {
      title: 'Company Settings',
      description: 'Configure company-specific settings',
      icon: Settings,
      action: () => navigate('/settings')
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Company Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your company's fleet and operations</p>
      </div>
      
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Setup Progress</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="space-y-6">
          <CompanyManagementWorkflow />
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className={action.primary ? 'border-primary shadow-lg' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {action.title}
                    </CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={action.action}
                      className="w-full"
                      variant={action.primary ? 'default' : 'outline'}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
