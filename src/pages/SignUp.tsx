
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingUpDatabase, setSettingUpDatabase] = useState(false);
  
  const locationIsFirstUser = location.state?.isFirstUser;

  // Function to manually set up database tables
  const setupDatabase = async () => {
    try {
      setSettingUpDatabase(true);
      
      console.log("Setting up database tables...");
      // Use the full Supabase URL to call the edge function
      const response = await fetch(
        `https://yyeypbfdtitxqssvnagy.supabase.co/functions/v1/create-profiles-table`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXlwYmZkdGl0eHFzc3ZuYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzOTI1NTgsImV4cCI6MjA0OTk2ODU1OH0.jKd7rzhCpkF76FIYUAwT7gK3YLaGtUstjM-IJmdY6As`
          }
        }
      );
      
      const result = await response.json();
      console.log("Setup result:", result);
      
      if (!response.ok) {
        console.warn("Warning: Database setup completed with issues:", result.error);
        toast({
          variant: "default",
          title: "Database Setup Warning",
          description: "Setup completed with issues: " + (result.error || "Unknown error")
        });
      } else {
        toast({
          title: "Database Setup Completed",
          description: "Database tables have been set up successfully."
        });
      }
      
      // Always set first user true if we're doing a manual setup
      setIsFirstUser(true);
      setError(null);
    } catch (err) {
      console.error("Error setting up database:", err);
      toast({
        variant: "destructive",
        title: "Database Setup Failed",
        description: "Failed to set up database tables. Proceeding as first user anyway."
      });
      // Even if setup fails, continue as first user
      setIsFirstUser(true);
      setError(null);
    } finally {
      setSettingUpDatabase(false);
    }
  };

  // Effect to set the isFirstUser state from location data
  useEffect(() => {
    if (locationIsFirstUser !== undefined) {
      console.log("Using location state for first user:", locationIsFirstUser);
      setIsFirstUser(locationIsFirstUser);
      setCheckingFirstUser(false);
    } else {
      // Default to true for first user if we can't determine
      console.log("Defaulting to first user setup");
      setIsFirstUser(true);
      setCheckingFirstUser(false);
      
      // Try to run database setup automatically
      setupDatabase();
    }
  }, [locationIsFirstUser]);

  // Store these values in variables to avoid using hooks in conditionals
  const isUserLoading = loading.get();
  const currentUser = user.get();

  // If already logged in and not first user, redirect to dashboard
  if (!isUserLoading && currentUser && !isFirstUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show loading while checking first user status
  if (checkingFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Checking application status...</span>
      </div>
    );
  }

  // If there's a connection error but we decided to proceed
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-4 max-w-md">
          <h2 className="font-semibold mb-2">Error</h2>
          <p className="mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">
            This could be due to a connection issue with the database or because the database tables haven't been set up yet.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={setupDatabase} 
            disabled={settingUpDatabase}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center"
          >
            {settingUpDatabase ? <LoadingSpinner size={16} className="mr-2" /> : <Database className="mr-2 h-4 w-4" />}
            {settingUpDatabase ? "Setting Up..." : "Setup Database"}
          </Button>
          <Button 
            onClick={() => { 
              setError(null);
              setIsFirstUser(true);
            }} 
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90"
          >
            Continue as First User
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mb-6">
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
          <h2 className="text-lg font-semibold mb-2">Welcome to Fleet Manager</h2>
          <p className="text-sm text-muted-foreground mb-3">
            You're setting up the application for the first time. Create a super admin account to get started.
          </p>
          <Button
            onClick={setupDatabase}
            disabled={settingUpDatabase}
            variant="outline"
            className="w-full"
          >
            {settingUpDatabase ? 
              <>
                <LoadingSpinner size={16} className="mr-2" />
                Setting up database...
              </> : 
              <>
                <Database className="mr-2 h-4 w-4" />
                Setup Database Tables
              </>
            }
          </Button>
        </div>
      </div>
      <SignUpForm isFirstUser={isFirstUser || false} />
    </div>
  );
}
