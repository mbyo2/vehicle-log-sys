import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building, Settings, Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProductionReadiness() {
  const { profile } = useAuth();
  const currentProfile = profile.get();
  const isSuperAdmin = currentProfile?.role === 'super_admin';

  const steps = [
    {
      id: 'auth-setup',
      title: 'Authentication Setup',
      description: 'Configure Supabase Auth settings for production',
      status: 'pending',
      action: 'Configure',
      link: 'https://supabase.com/dashboard/project/yyeypbfdtitxqssvnagy/auth/providers'
    },
    {
      id: 'email-config',
      title: 'Email Configuration',
      description: 'Set up custom SMTP for email notifications',
      status: 'pending',
      action: 'Setup SMTP',
      link: 'https://supabase.com/dashboard/project/yyeypbfdtitxqssvnagy/settings/auth'
    },
    {
      id: 'domain-setup',
      title: 'Custom Domain',
      description: 'Configure your custom domain for the application',
      status: 'pending',
      action: 'Add Domain',
      link: '#'
    },
    {
      id: 'security-review',
      title: 'Security Review',
      description: 'Review and configure security policies',
      status: 'completed',
      action: 'Review',
      link: '/security'
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Set up user roles and invite team members',
      status: 'ready',
      action: 'Manage Users',
      link: '/users'
    },
    {
      id: 'company-setup',
      title: 'Company Configuration',
      description: 'Configure company settings and branding',
      status: 'ready',
      action: 'Configure',
      link: '/companies'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case 'ready':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Ready</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Production Setup</CardTitle>
          <CardDescription>
            This section is only accessible to super administrators.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Production Readiness</h1>
        <p className="text-muted-foreground">
          Complete these steps to get your fleet management system ready for production use.
        </p>
      </div>

      <div className="grid gap-4">
        {steps.map((step) => (
          <Card key={step.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {step.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <CardTitle className="text-lg">{step.title}</CardTitle>
                {getStatusBadge(step.status)}
              </div>
              {step.link.startsWith('http') ? (
                <Button asChild variant="outline" size="sm">
                  <a href={step.link} target="_blank" rel="noopener noreferrer">
                    {step.action}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              ) : step.link !== '#' ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={step.link}>
                    {step.action}
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <CardDescription>{step.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">1. Set up your team</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Create company admin accounts and invite supervisors and drivers
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Building className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">2. Configure companies</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Set up company profiles, branding, and subscription types
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">3. Configure authentication</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Set up proper redirect URLs and email templates in Supabase
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">4. Review security</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ensure all security policies are properly configured
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}