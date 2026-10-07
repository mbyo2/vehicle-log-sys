import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney } from "@/lib/formatMoney";

/** Default currency of the active company (falls back to ZAR / R). */
export function useCompanyCurrency() {
  const { profile } = useAuth();
  const companyId = profile.get()?.company_id ?? null;

  const { data } = useQuery({
    queryKey: ["company-currency", companyId],
    queryFn: async () => {
      let q = supabase.from("currency_settings").select("currency_code, symbol").eq("is_default", true).limit(1);
      if (companyId) q = q.eq("company_id", companyId);
      const { data, error } = await q.maybeSingle();
      if (error) return null;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const code = data?.currency_code || "ZAR";
  const symbol = data?.symbol || "R";
  const format = useCallback(
    (value: number | string | null | undefined, digits = 2) => formatMoney(value, symbol, digits),
    [symbol]
  );
  return { code, symbol, format };
}
