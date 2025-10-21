import React from 'react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { SuperAdminWorkflow } from './SuperAdminWorkflow';
import { CompanyAdminWorkflow } from './CompanyAdminWorkflow';
import { SupervisorWorkflow } from './SupervisorWorkflow';
import { DriverWorkflow } from './DriverWorkflow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function WorkflowManager() {
  const { user, profile, loading } = useEnhancedAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Profile not found. Please contact support.</p>
      </div>
    );
  }

  // Profile now has role attached from user_roles table
  switch (profile.role) {
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
        <div className="flex items-center justify-center min-h-screen">
          <p>Unknown role: {profile.role}</p>
        </div>
      );
  }
}
