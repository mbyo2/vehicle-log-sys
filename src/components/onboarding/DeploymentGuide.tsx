import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, ExternalLink, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TestingGuide } from "./TestingGuide";

export function DeploymentGuide() {
  const [showUrls, setShowUrls] = useState(false);
  const { toast } = useToast();

  const currentUrl = window.location.origin;
  const supabaseProjectId = "yyeypbfdtitxqssvnagy";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const deploymentSteps = [
    {
      title: "Configure Supabase Auth URLs",
      description: "Set up proper redirect URLs for authentication",
      critical: true,
      status: "required",
      steps: [
        "Go to Supabase Auth Settings",
        `Set Site URL to: ${currentUrl}`,
        `Add Redirect URL: ${currentUrl}/auth/callback`,
        "Add your production domain when ready"
      ]
    },
    {
      title: "Email Configuration",
      description: "Configure email templates and SMTP",
      critical: false,
      status: "recommended",
      steps: [
        "Set up custom SMTP provider",
        "Configure email templates",
        "Test email delivery"
      ]
    },
    {
      title: "Domain Configuration",
      description: "Set up your custom domain",
      critical: false,
      status: "optional",
      steps: [
        "Purchase and configure domain",
        "Set up DNS records",
        "Configure SSL certificate"
      ]
    }
  ];

  const requiredUrls = [
    {
      label: "Site URL",
      value: currentUrl,
      description: "Main application URL"
    },
    {
      label: "Redirect URL",
      value: `${currentUrl}/auth/callback`,
      description: "Authentication callback URL"
    }
  ];

  return (
    <Tabs defaultValue="deploy" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="deploy">Deployment</TabsTrigger>
        <TabsTrigger value="testing">Testing</TabsTrigger>
      </TabsList>

      <TabsContent value="deploy" className="space-y-6">
        <DeploymentContent 
          currentUrl={currentUrl}
          supabaseProjectId={supabaseProjectId}
          showUrls={showUrls}
          setShowUrls={setShowUrls}
          copyToClipboard={copyToClipboard}
          requiredUrls={requiredUrls}
          deploymentSteps={deploymentSteps}
        />
      </TabsContent>

      <TabsContent value="testing" className="space-y-6">
        <TestingGuide />
      </TabsContent>
    </Tabs>
  );
}

function DeploymentContent({ 
  currentUrl, 
  supabaseProjectId, 
  showUrls, 
  setShowUrls, 
  copyToClipboard, 
  requiredUrls, 
  deploymentSteps 
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Deployment Guide</h2>
        <p className="text-muted-foreground">
          Follow these steps to deploy your fleet management system to production.
        </p>
      </div>

      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Important:</strong> Configure authentication URLs before allowing users to sign up.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Required URLs Configuration
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUrls(!showUrls)}
            >
              {showUrls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showUrls ? "Hide" : "Show"} URLs
            </Button>
          </CardTitle>
          <CardDescription>
            Configure these URLs in your Supabase project settings
          </CardDescription>
        </CardHeader>
        {showUrls && (
          <CardContent className="space-y-4">
            {requiredUrls.map((url, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{url.label}</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(url.value, url.label)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md font-mono text-sm">
                  {url.value}
                </div>
                <p className="text-xs text-muted-foreground">{url.description}</p>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Deployment Steps</h3>
        {deploymentSteps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  {step.critical ? (
                    <Badge variant="destructive">Critical</Badge>
                  ) : step.status === "recommended" ? (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      Recommended
                    </Badge>
                  ) : (
                    <Badge variant="outline">Optional</Badge>
                  )}
                </div>
                {step.title === "Configure Supabase Auth URLs" && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`https://supabase.com/dashboard/project/${supabaseProjectId}/auth/url-configuration`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Configure
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {step.steps.map((stepItem, stepIndex) => (
                  <li key={stepIndex} className="text-muted-foreground">
                    {stepItem}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">
            <CheckCircle className="h-5 w-5 inline mr-2" />
            Ready to Deploy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-800 dark:text-green-200 mb-4">
            Your application is ready for production! Once you configure the authentication URLs,
            you can start inviting users and companies to use your fleet management system.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <a
                href="https://docs.lovable.dev/user-guides/publish"
                target="_blank"
                rel="noopener noreferrer"
              >
                Deploy Guide
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={`https://supabase.com/dashboard/project/${supabaseProjectId}/auth/url-configuration`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Configure Auth
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}