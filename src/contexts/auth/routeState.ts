export function authRouteState(user: unknown, profile: unknown, loading: boolean) {
  if (loading) return 'loading';
  if (!user) return 'signed-out';
  if (!profile) return 'profile-error';
  return 'ready';
}