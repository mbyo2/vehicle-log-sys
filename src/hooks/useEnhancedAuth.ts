import { useAuth } from '@/contexts/AuthContext';
import { authState } from '@/contexts/auth/AuthState';
import { fetchUserProfile } from '@/contexts/auth/fetchUserProfile';
import { hasPermission as checkPermission, getPermissionsForRole } from '@/lib/permissions';

/** Permissions are derived from the same auth state used by route guards. */
export function useEnhancedAuth() {
  const auth = useAuth();
  const user = auth.user.get();
  const profile = auth.profile.get();
  const loading = auth.loading.get();
  const role = profile?.role ?? null;

  const refetchProfile = async () => {
    if (!user) return null;
    authState.loading.set(true);
    try {
      const updated = await fetchUserProfile(user.id);
      if (authState.user.peek()?.id === user.id) authState.profile.set(updated);
      return updated;
    } finally {
      authState.loading.set(false);
    }
  };

  return {
    user, profile, loading, role,
    permissions: role ? getPermissionsForRole(role) : [],
    hasPermission: (resource: string, action: string) => checkPermission(role, resource, action),
    signOut: auth.signOut,
    refetchProfile,
  };
}
