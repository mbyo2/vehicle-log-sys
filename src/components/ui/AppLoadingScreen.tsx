
import React from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';

export function AppLoadingScreen() {
  const { loading } = useAuth();
  const isLoading = loading.get();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg">
        <LoadingSpinner size="lg" />
        <h3 className="text-xl font-semibold text-primary">Loading FleetManager</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Initializing your fleet management experience...
        </p>
      </div>
    </div>
  );
}
