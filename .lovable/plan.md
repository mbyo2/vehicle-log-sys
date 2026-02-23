
# Complete App Fix Plan

## Critical Issues Found

### Issue 1: Super Admin Gets "driver" Role (BLOCKING)
The `app_role` enum has internal sort order: `super_admin=1, company_admin=2, supervisor=3, driver=4`. When the code queries `user_roles` with `.order('role', { ascending: false })`, PostgreSQL uses the enum sort order (not alphabetical), so `driver` (order 4) comes first. The super admin account also has a spurious `driver` role entry in the database.

**Root cause locations:**
- `src/contexts/AuthContext.tsx` line 111: `ascending: false` returns `driver` instead of `super_admin`
- `src/hooks/useEnhancedAuth.ts` line 266: Same bug
- Database: The super admin user has both `super_admin` and `driver` roles (the `driver` entry needs to be removed)

### Issue 2: "Verifying authentication..." Hang (BLOCKING)
After sign-in, `useAuthActions.signIn()` sets `authState.loading.set(true)` (line 88) but then `authState.loading.set(false)` only runs in `finally` (line 200). Meanwhile, `AuthContext`'s `onAuthStateChange` fetches profile in a `setTimeout` which races with the loading state. The `ProtectedRoute` sees `loading=true` and shows the spinner indefinitely.

### Issue 3: Dual Auth Systems Conflict
`SignInForm` uses `useEnhancedAuth().signIn()` while `useAuthActions` also exists. Both independently fetch profiles and manage state, causing race conditions and duplicate fetches (console shows "Profile loaded with role: driver" twice).

## Fix Plan

### Step 1: Remove Spurious Driver Role from Database
Delete the incorrect `driver` role for the super admin user using a data operation.

### Step 2: Fix Role Sorting in All Auth Code
Change `.order('role', { ascending: false })` to `.order('role', { ascending: true })` in:
- `src/contexts/AuthContext.tsx` (line 111)
- `src/hooks/useEnhancedAuth.ts` (line 266)
- `src/contexts/auth/useAuthActions.ts` (line 152)

With `ascending: true`, `super_admin` (sort order 1) comes first, which is the correct priority.

### Step 3: Fix Loading State Race Condition
In `src/contexts/AuthContext.tsx`:
- Remove the `setTimeout` wrapping profile fetches (lines 161-167 and 197-204)
- Ensure `authState.loading` is properly managed: set to `true` before profile fetch, `false` after
- In `onAuthStateChange` handler, set `loading=true` before fetching profile, `loading=false` after

### Step 4: Unify Sign-In Flow
Update `SignInForm` to use the `useAuthActions` hook (which does proper navigation and profile loading) instead of `useEnhancedAuth`. Keep `useEnhancedAuth` for permission checks only, not for sign-in.

### Step 5: Remove Redundant Profile Fetch from useAuthActions
Since `AuthContext`'s `onAuthStateChange` already handles profile loading on `SIGNED_IN`, `useAuthActions.signIn()` should NOT also fetch the profile. It should just call `supabase.auth.signInWithPassword()` and let the auth state change handler do the rest.

## Technical Details

### Files to modify:
1. **Database** - Delete spurious `driver` role for super admin user
2. **`src/contexts/AuthContext.tsx`** - Fix sort order, remove setTimeout, fix loading state management
3. **`src/hooks/useEnhancedAuth.ts`** - Fix sort order to `ascending: true`
4. **`src/contexts/auth/useAuthActions.ts`** - Fix sort order, simplify signIn to avoid double-fetching
5. **`src/components/auth/SignInForm.tsx`** - Use `useAuthActions` for sign-in, keep `useEnhancedAuth` only for other features

### Expected outcome:
- Sign-in works immediately without hanging
- Super admin role is correctly detected
- Dashboard loads with proper super admin workflow
- Navigation shows all admin-level menu items
