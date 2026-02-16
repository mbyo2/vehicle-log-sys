import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SuperAdminWorkflow } from './SuperAdminWorkflow';
import { CompanyAdminWorkflow } from './CompanyAdminWorkflow';
import { SupervisorWorkflow } from './SupervisorWorkflow';
import { DriverWorkflow } from './DriverWorkflow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function WorkflowManager() {
  const { user, profile, loading } = useAuth();

  const currentUser = user.get();
  const currentProfile = profile.get();
  const isLoading = loading.get();

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Profile not found. Please contact support.</p>
      </div>
    );
  }

  switch (currentProfile.role) {
    case 'super_admin':
      return <SuperAdminWorkflow />;
    case 'company_admin':
      return <CompanyAdminWorkflow />;
    case 'supervisor':
      return <SupervisorWorkflow />;
    case 'driver':
      return <DriverWorkflow />;
    default:
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Unknown role: {currentProfile.role}</p>
        </div>
      );
  }
}
