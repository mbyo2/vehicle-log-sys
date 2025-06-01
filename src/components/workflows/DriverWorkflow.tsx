
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Map, Wrench, Calendar, MessageSquare, GraduationCap } from 'lucide-react';

export function DriverWorkflow() {
  const navigate = useNavigate();

  const workflows = [
    {
      title: 'My Trips',
      description: 'View and manage your assigned trips',
      icon: Map,
      action: () => navigate('/trips'),
      primary: true
    },
    {
      title: 'Vehicle Status',
      description: 'Check your assigned vehicle status',
      icon: Wrench,
      action: () => navigate('/vehicle-status'),
      primary: true
    },
    {
      title: 'Driver Portal',
      description: 'Access your personal driver dashboard',
      icon: Car,
      action: () => navigate('/driver-portal')
    },
    {
      title: 'Service Bookings',
      description: 'Request vehicle maintenance',
      icon: Calendar,
      action: () => navigate('/service-bookings')
    },
    {
      title: 'Messages',
      description: 'Check messages from supervisors',
      icon: MessageSquare,
      action: () => navigate('/driver/messages')
    },
    {
      title: 'Training & Certifications',
      description: 'View and complete required training',
      icon: GraduationCap,
      action: () => navigate('/driver/trainings')
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
        <p className="text-muted-foreground">Manage your trips and vehicle responsibilities</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
