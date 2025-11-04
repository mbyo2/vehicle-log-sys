import { observable } from '@legendapp/state';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/auth';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  currentCompanyId: string | null;
}

export const authState = observable<AuthState>({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  currentCompanyId: null
});

// Helper functions to safely access state values
export const getUser = () => authState.user.get();
export const getProfile = () => authState.profile.get();
export const getLoading = () => authState.loading.get();
export const getInitialized = () => authState.initialized.get();
export const getCurrentCompanyId = () => authState.currentCompanyId.get();
