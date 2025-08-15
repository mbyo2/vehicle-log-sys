import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Building, Settings, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function TestingGuide() {
  const testingSteps = [
    {
      title: "Super Admin Setup",
      description: "Test the initial super admin account creation",
      status: "critical",
      actions: [
        "Go to /signup to create the first super admin account",
        "Verify you can access all administrative features",
        "Test navigation between different sections"
      ]
    },
    {
      title: "Company Creation",
      description: "Test company onboarding flow",
      status: "important",
      actions: [
        "Navigate to Companies section",
        "Create a test company with trial subscription",
        "Verify company settings and branding options"
      ]
    },
    {
      title: "User Management",
      description: "Test user invitation and role assignment",
      status: "important",
      actions: [
        "Create company admin accounts",
        "Test supervisor and driver role assignments", 
        "Verify role-based access controls"
      ]
    },
    {
      title: "Authentication Flow",
      description: "Test sign up and sign in functionality",
      status: "critical",
      actions: [
        "Test sign up flow for different user types",
        "Test sign in with various roles",
        "Verify password reset functionality"
      ]
    },
    {
      title: "Fleet Management",
      description: "Test core fleet management features",
      status: "important",
      actions: [
        "Add vehicles to the fleet",
        "Assign vehicles to drivers",
        "Test trip logging and management"
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'important':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Testing Guide</h2>
        <p className="text-muted-foreground">
          Follow this guide to thoroughly test your fleet management system before inviting real users.
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Start Here:</strong> Make sure authentication URLs are configured in Supabase before testing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {testingSteps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(step.status)}>
                  {step.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {step.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="flex items-start space-x-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">Quick Test Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Super admin account created successfully</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Can create and manage companies</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>User invitation system working</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Role-based access controls enforced</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Fleet management features operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Security policies and audit logging active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild>
          <Link to="/setup">
            Go to Setup
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a
            href="https://supabase.com/dashboard/project/yyeypbfdtitxqssvnagy/auth/url-configuration"
            target="_blank"
            rel="noopener noreferrer"
          >
            Configure Auth URLs
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>
    </div>
  );
}