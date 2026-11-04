ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  lenco_reference text,
  payment_type text,
  failure_reason text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.subscription_payments TO authenticated;
GRANT ALL ON public.subscription_payments TO service_role;

CREATE POLICY "Company admins view own company payments"
ON public.subscription_payments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_current_company_id())
);
-- Writes happen only from server functions using the service role.