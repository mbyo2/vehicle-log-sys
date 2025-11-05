import { useCompanyBranding } from '@/hooks/useCompanyBranding';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyBrandingProviderProps {
  children: React.ReactNode;
}

export function CompanyBrandingProvider({ children }: CompanyBrandingProviderProps) {
  const { user } = useAuth();
  
  // Only apply branding if user is authenticated
  if (user) {
    useCompanyBranding();
  }

  return <>{children}</>;
}
