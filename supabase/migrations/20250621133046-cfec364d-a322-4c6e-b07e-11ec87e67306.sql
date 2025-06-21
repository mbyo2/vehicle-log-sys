
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Company admins can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;

-- Update the signUpSchema to make company fields required when role is company_admin
-- and add a trigger to create companies during signup

-- Add a function to create a company when a company admin signs up
CREATE OR REPLACE FUNCTION public.create_company_for_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  trial_end_date timestamp with time zone;
BEGIN
  -- Only create company for company_admin role
  IF NEW.raw_app_meta_data->>'role' = 'company_admin' THEN
    -- Calculate trial end date (25 days from now)
    trial_end_date := now() + interval '25 days';
    
    -- Create the company
    INSERT INTO public.companies (
      name,
      subscription_type,
      trial_start_date,
      trial_end_date,
      created_by,
      is_active
    )
    VALUES (
      NEW.raw_app_meta_data->>'company_name',
      COALESCE((NEW.raw_app_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type),
      CASE 
        WHEN COALESCE((NEW.raw_app_meta_data->>'subscription_type')::text, 'trial') = 'trial' 
        THEN now() 
        ELSE NULL 
      END,
      CASE 
        WHEN COALESCE((NEW.raw_app_meta_data->>'subscription_type')::text, 'trial') = 'trial' 
        THEN trial_end_date 
        ELSE NULL 
      END,
      NEW.id,
      true
    )
    RETURNING id INTO new_company_id;
    
    -- Update the user's metadata to include the company_id
    UPDATE auth.users 
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('company_id', new_company_id)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after profile is created
DROP TRIGGER IF EXISTS on_company_admin_created ON public.profiles;
CREATE TRIGGER on_company_admin_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  WHEN (NEW.role = 'company_admin')
  EXECUTE PROCEDURE public.create_company_for_admin();

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own company
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow company admins to update their own company
CREATE POLICY "Company admins can update their own company" ON public.companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('company_admin', 'super_admin')
    )
  );

-- Allow super admins to view all companies
CREATE POLICY "Super admins can view all companies" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
