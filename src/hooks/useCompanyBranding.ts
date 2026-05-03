import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authState } from '@/contexts/auth/AuthState';
import type { Company } from '@/types/auth';

const BRANDING_VARS = ['--primary', '--ring', '--secondary'] as const;

export function useCompanyBranding() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to auth currentCompanyId via Legend-state at the top level
  const companyId = authState.currentCompanyId.get();

  useEffect(() => {
    let cancelled = false;

    const loadCompanyBranding = async () => {
      if (!companyId) {
        clearBranding();
        setCompany(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('Error loading company branding:', error);
          setCompany(null);
          clearBranding();
        } else if (data) {
          setCompany(data);
          applyBranding(data);
        }
      } catch (err) {
        console.error('Error in loadCompanyBranding:', err);
        if (!cancelled) {
          setCompany(null);
          clearBranding();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCompanyBranding();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { company, loading };
}

function clearBranding() {
  const root = document.documentElement;
  BRANDING_VARS.forEach((v) => root.style.removeProperty(v));
}

function applyBranding(company: Company) {
  const root = document.documentElement;

  if (company.branding_primary_color) {
    const primaryHSL = hexToHSL(company.branding_primary_color);
    if (primaryHSL) {
      root.style.setProperty('--primary', primaryHSL);
      root.style.setProperty('--ring', primaryHSL);
    }
  } else {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--ring');
  }

  if (company.branding_secondary_color) {
    const secondaryHSL = hexToHSL(company.branding_secondary_color);
    if (secondaryHSL) {
      root.style.setProperty('--secondary', secondaryHSL);
    }
  } else {
    root.style.removeProperty('--secondary');
  }
}

function hexToHSL(hex: string): string | null {
  hex = hex.replace('#', '');
  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  if ([r, g, b].some(Number.isNaN)) return null;

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

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
