import { supabase } from '@/integrations/supabase/client';
import { authState } from '@/contexts/auth/AuthState';

/**
 * Shared profile fetcher used by both AuthContext and useAuthActions.
 * Handles company resolution and role prioritization.
 */
export const fetchUserProfile = async (userId: string) => {
  try {
    console.log(`[Auth] Fetching profile for user ${userId}`);
    
    const savedCompanyId = localStorage.getItem('current_company_id');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[Auth] Profile fetch error:', error);
      return null;
    }
    
    if (!data) {
      console.warn('[Auth] No profile found for user:', userId);
      return null;
    }

    // Fetch all companies for this user
    const { data: companiesData } = await supabase.rpc('get_user_companies', {
      p_user_id: userId
    });
    
    if (companiesData && companiesData.length > 0) {
      let targetCompanyId = savedCompanyId;
      const validCompany = companiesData.find((c: any) => c.company_id === savedCompanyId);
      
      if (!validCompany) {
        targetCompanyId = companiesData[0].company_id;
        localStorage.setItem('current_company_id', targetCompanyId!);
      }
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('company_id', targetCompanyId!)
        .maybeSingle();
      
      // Fetch the company's industry_type
      const { data: companyData } = await supabase
        .from('companies')
        .select('industry_type')
        .eq('id', targetCompanyId!)
        .maybeSingle();
      
      const userRole = roleData?.role || 'driver';
      const industryType = (companyData as any)?.industry_type || 'general';
      authState.currentCompanyId.set(targetCompanyId);
      
      console.log('[Auth] Profile loaded with role:', userRole, 'for company:', targetCompanyId, 'industry:', industryType);
      return { ...data, role: userRole, company_id: targetCompanyId, industry_type: industryType };
    } else {
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
    }
    
    console.warn('[Auth] No role found for user:', userId);
    return { ...data, role: 'driver', company_id: null };
  } catch (err) {
    console.error('[Auth] Profile fetch failed:', err);
    return null;
  }
};
