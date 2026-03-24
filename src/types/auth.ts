export type UserRole = 'super_admin' | 'company_admin' | 'supervisor' | 'driver';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  company_id?: string;
  two_factor_enabled?: boolean;
  two_factor_method?: string;
}

export type IndustryType = 'mining' | 'transport' | 'logistics' | 'construction' | 'agriculture' | 'general' | 'other';

export const INDUSTRY_TYPES: { value: IndustryType; label: string }[] = [
  { value: 'mining', label: 'Mining' },
  { value: 'transport', label: 'Transport' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

export interface Company {
  id: string;
  name: string;
  subscription_type: 'trial' | 'full';
  trial_start_date?: string;
  trial_end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  logo_url?: string;
  branding_primary_color?: string;
  branding_secondary_color?: string;
  industry_type: IndustryType;
}

export interface UserCompanyMembership {
  company_id: string;
  company_name: string;
  company_logo: string | null;
  role: UserRole;
  is_active: boolean;
  subscription_type: 'trial' | 'full';
}