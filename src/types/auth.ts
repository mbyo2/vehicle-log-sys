export type UserRole = 'admin' | 'supervisor' | 'driver';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone_number?: string;
}