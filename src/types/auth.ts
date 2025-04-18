export type UserRole = 'super_admin' | 'company_admin' | 'supervisor' | 'driver';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  company_id?: string;
}

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
}