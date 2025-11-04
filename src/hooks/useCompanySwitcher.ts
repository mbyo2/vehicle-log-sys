import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserCompanyMembership } from '@/types/auth';

const CURRENT_COMPANY_KEY = 'current_company_id';

export function useCompanySwitcher(userId: string | undefined) {
  const [companies, setCompanies] = useState<UserCompanyMembership[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load companies for the user
  const loadCompanies = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_companies', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error loading companies:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your companies'
        });
        return;
      }

      setCompanies(data || []);

      // Set current company if not already set
      if (data && data.length > 0) {
        const savedCompanyId = localStorage.getItem(CURRENT_COMPANY_KEY);
        const validSavedCompany = data.find((c: UserCompanyMembership) => c.company_id === savedCompanyId);
        
        if (validSavedCompany) {
          setCurrentCompanyId(savedCompanyId);
        } else {
          // Default to first company
          setCurrentCompanyId(data[0].company_id);
          localStorage.setItem(CURRENT_COMPANY_KEY, data[0].company_id);
        }
      }
    } catch (error) {
      console.error('Error in loadCompanies:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Switch to a different company
  const switchCompany = useCallback(async (companyId: string) => {
    if (!userId) return;

    const targetCompany = companies.find(c => c.company_id === companyId);
    if (!targetCompany) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Company not found'
      });
      return;
    }

    try {
      // Get the role for this company
      const { data: role, error } = await supabase.rpc('get_user_role_for_company', {
        p_user_id: userId,
        p_company_id: companyId
      });

      if (error) {
        console.error('Error getting role for company:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to switch company'
        });
        return;
      }

      // Update current company
      setCurrentCompanyId(companyId);
      localStorage.setItem(CURRENT_COMPANY_KEY, companyId);

      toast({
        title: 'Company Switched',
        description: `Now viewing ${targetCompany.company_name} as ${role}`
      });

      // Reload the page to refresh all data with new company context
      window.location.reload();
    } catch (error) {
      console.error('Error switching company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to switch company'
      });
    }
  }, [userId, companies, toast]);

  // Get current company details
  const currentCompany = companies.find(c => c.company_id === currentCompanyId);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return {
    companies,
    currentCompany,
    currentCompanyId,
    loading,
    switchCompany,
    refetch: loadCompanies
  };
}
