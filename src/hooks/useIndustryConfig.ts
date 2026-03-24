import { useAuth } from '@/contexts/AuthContext';
import { IndustryType } from '@/types/auth';
import {
  getVehicleCategories,
  getIndustryVehicleFields,
  getDashboardWidgets,
  getReportTabs,
  getIndustryInfo,
  INDUSTRY_HIDDEN_NAV,
} from '@/lib/industryConfig';

/**
 * Hook to access industry-specific configuration for the current company.
 */
export function useIndustryConfig() {
  const { profile } = useAuth();
  const currentProfile = profile?.get();

  // Default to 'general' if no industry set
  const industryType: IndustryType = (currentProfile as any)?.industry_type || 'general';

  return {
    industryType,
    vehicleCategories: getVehicleCategories(industryType),
    vehicleFields: getIndustryVehicleFields(industryType),
    dashboardWidgets: getDashboardWidgets(industryType),
    reportTabs: getReportTabs(industryType),
    industryInfo: getIndustryInfo(industryType),
    hiddenNavPaths: INDUSTRY_HIDDEN_NAV[industryType] || [],
    isNavItemVisible: (href: string) => {
      const hidden = INDUSTRY_HIDDEN_NAV[industryType] || [];
      return !hidden.includes(href);
    },
  };
}
