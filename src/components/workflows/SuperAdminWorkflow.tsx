
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, Settings, BarChart3 } from 'lucide-react';

export function SuperAdminWorkflow() {
  const navigate = useNavigate();

  const workflows = [
    {
      title: 'Company Management',
      description: 'Create, manage, and monitor all companies in the system',
      icon: Building,
      action: () => navigate('/companies'),
      primary: true
    },
    {
      title: 'System Analytics',
      description: 'View system-wide analytics and reports',
      icon: BarChart3,
      action: () => navigate('/analytics')
    },
    {
      title: 'User Management',
      description: 'Manage users across all companies',
      icon: Users,
      action: () => navigate('/users')
    },
    {
      title: 'System Settings',
      description: 'Configure global system settings',
      icon: Settings,
      action: () => navigate('/settings')
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage the entire fleet management system</p>
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
