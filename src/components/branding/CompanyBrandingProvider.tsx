import { useCompanyBranding } from '@/hooks/useCompanyBranding';

interface CompanyBrandingProviderProps {
  children: React.ReactNode;
}

export function CompanyBrandingProvider({ children }: CompanyBrandingProviderProps) {
  // Hook must be called unconditionally; the hook itself no-ops when
  // there is no current company.
  useCompanyBranding();
  return <>{children}</>;
}
