import { supabase } from '@/integrations/supabase/client';
import { authState } from '@/contexts/auth/AuthState';

/**
 * Shared profile fetcher used by both AuthContext and useAuthActions.
 * Handles company resolution and role prioritization.
 *
 * Parallelizes independent queries to keep sign-in fast:
 *  1. profile + companies list  (parallel)
 *  2. user_role + company industry_type  (parallel, after target company resolved)
 */
export const fetchUserProfile = async (userId: string) => {
  const t0 = performance.now();
  const mark = (label: string, start: number) =>
    console.log(`[Auth][timing] ${label}: ${(performance.now() - start).toFixed(0)}ms (fp total ${(performance.now() - t0).toFixed(0)}ms)`);

  try {
    console.log(`[Auth] Fetching profile for user ${userId}`);

    const savedCompanyId = localStorage.getItem('current_company_id');

    // Round-trip 1: profile + user's companies in parallel
    const tRt1 = performance.now();
    const [profileRes, companiesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.rpc('get_user_companies', { p_user_id: userId }),
    ]);
    mark('rt1:profile+get_user_companies', tRt1);

    if (profileRes.error) {
      console.error('[Auth] Profile fetch error:', profileRes.error);
      return null;
    }
    const data = profileRes.data;
    if (!data) {
      console.warn('[Auth] No profile found for user:', userId);
      return null;
    }


    const companiesData = companiesRes.data as any[] | null;

    if (companiesData && companiesData.length > 0) {
      const validCompany = companiesData.find((c: any) => c.company_id === savedCompanyId);
      const targetCompanyId = (validCompany?.company_id ?? companiesData[0].company_id) as string;
      if (!validCompany) {
        localStorage.setItem('current_company_id', targetCompanyId);
      }

      // Round-trip 2: role + industry in parallel
      const tRt2 = performance.now();
      const [roleRes, companyRes] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('company_id', targetCompanyId)
          .maybeSingle(),
        supabase
          .from('companies')
          .select('industry_type')
          .eq('id', targetCompanyId)
          .maybeSingle(),
      ]);
      mark('rt2:user_roles+companies', tRt2);

      const userRole = roleRes.data?.role || 'driver';
      const industryType = (companyRes.data as any)?.industry_type || 'general';
      authState.currentCompanyId.set(targetCompanyId);

      console.log('[Auth] Profile loaded with role:', userRole, 'for company:', targetCompanyId, 'industry:', industryType);
      return { ...data, role: userRole, company_id: targetCompanyId, industry_type: industryType };
    }

    // Fallback: super_admin or user without company
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', userId)
      .order('role', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (roleData) {
      console.log('[Auth] User role found (no company):', roleData.role);
      return { ...data, role: roleData.role, company_id: roleData.company_id };
    }

    console.warn('[Auth] No role found for user:', userId);
    return { ...data, role: 'driver', company_id: null };
  } catch (err) {
    console.error('[Auth] Profile fetch failed:', err);
    return null;
  }
};
