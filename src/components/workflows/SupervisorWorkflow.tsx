
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, ClipboardCheck, Calendar, FileText } from 'lucide-react';

export function SupervisorWorkflow() {
  const navigate = useNavigate();

  const workflows = [
    {
      title: 'Trip Approvals',
      description: 'Review and approve driver trip requests',
      icon: ClipboardCheck,
      action: () => navigate('/trip-approvals'),
      primary: true
    },
    {
      title: 'Fleet Overview',
      description: 'Monitor vehicle status and assignments',
      icon: Car,
      action: () => navigate('/fleet'),
      primary: true
    },
    {
      title: 'Service Bookings',
      description: 'Schedule vehicle maintenance and services',
      icon: Calendar,
      action: () => navigate('/service-bookings')
    },
    {
      title: 'Documents',
      description: 'Review vehicle and driver documents',
      icon: FileText,
      action: () => navigate('/documents')
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Supervisor Dashboard</h1>
        <p className="text-muted-foreground">Oversee fleet operations and approve requests</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((workflow, index) => {
          const Icon = workflow.icon;
          return (
            <Card key={index} className={workflow.primary ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {workflow.title}
                </CardTitle>
                <CardDescription>{workflow.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={workflow.action}
                  className="w-full"
                  variant={workflow.primary ? 'default' : 'outline'}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
