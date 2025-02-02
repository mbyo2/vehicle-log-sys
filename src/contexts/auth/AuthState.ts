import { observable } from '@legendapp/state';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/auth';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
}

export const authState = observable<AuthState>({
  user: null,
  profile: null,
  loading: true,
  initialized: false
});