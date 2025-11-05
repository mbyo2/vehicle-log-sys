import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/contexts/auth/AuthState';
import type { Company } from '@/types/auth';

export function useCompanyBranding() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanyBranding = async () => {
      const companyId = getCurrentCompanyId();
      
      if (!companyId) {
        setCompany(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (error) {
          console.error('Error loading company branding:', error);
          setCompany(null);
        } else {
          setCompany(data);
          applyBranding(data);
        }
      } catch (err) {
        console.error('Error in loadCompanyBranding:', err);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyBranding();
  }, [getCurrentCompanyId()]);

  return { company, loading };
}

function applyBranding(company: Company) {
  const root = document.documentElement;

  if (company.branding_primary_color) {
    const primaryHSL = hexToHSL(company.branding_primary_color);
    if (primaryHSL) {
      root.style.setProperty('--primary', primaryHSL);
      root.style.setProperty('--ring', primaryHSL);
    }
  }

  if (company.branding_secondary_color) {
    const secondaryHSL = hexToHSL(company.branding_secondary_color);
    if (secondaryHSL) {
      root.style.setProperty('--secondary', secondaryHSL);
    }
  }
}

function hexToHSL(hex: string): string | null {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to HSL values
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}
