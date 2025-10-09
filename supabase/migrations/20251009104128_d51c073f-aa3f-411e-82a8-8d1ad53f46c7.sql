-- Drop existing functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'supervisor', 'driver');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'company_admin' THEN 2
      WHEN 'supervisor' THEN 3
      WHEN 'driver' THEN 4
    END
  LIMIT 1
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, company_id)
SELECT id, 
       role::text::app_role,
       company_id
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Recreate get_current_user_role to use user_roles table
CREATE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.get_user_primary_role(auth.uid()),
    'driver'::app_role
  )
$$;

-- Recreate get_user_role to use user_roles table
CREATE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_primary_role(user_id);
$$;

-- Recreate the policies that were dropped
CREATE POLICY "Super admins can manage rate limits"
ON auth_rate_limits
FOR ALL
USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "security_events_super_admin"
ON security_events
FOR SELECT
USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "security_events_company_admin"
ON security_events
FOR SELECT
USING (
  (get_current_user_role() = 'company_admin'::app_role) 
  AND (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.company_id = get_current_company_id()))
);

CREATE POLICY "workflow_states_admin_manage"
ON workflow_states
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'company_admin'::app_role]));

CREATE POLICY "role_permissions_admin_access"
ON role_permissions
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'company_admin'::app_role]));

CREATE POLICY "profiles_read_access"
ON profiles
FOR SELECT
USING (
  (auth.uid() = id) 
  OR (get_current_user_role() = 'super_admin'::app_role) 
  OR ((get_current_user_role() = 'company_admin'::app_role) AND (company_id = get_current_company_id()))
);

CREATE POLICY "profiles_super_admin_manage"
ON profiles
FOR ALL
USING (get_current_user_role() = 'super_admin'::app_role)
WITH CHECK (get_current_user_role() = 'super_admin'::app_role);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can view company roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND public.has_role(auth.uid(), 'company_admin')
);

-- Update handle_new_user function to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  is_first_user boolean;
  user_role app_role;
  user_company_id uuid;
  new_company_id uuid;
  company_name text;
  subscription_type subscription_type;
  trial_end_date timestamp with time zone;
BEGIN
  -- Check if this is the first user (no existing user_roles)
  SELECT COUNT(*) = 0 INTO is_first_user FROM user_roles;
  
  IF is_first_user THEN
    -- First user automatically becomes super admin
    user_role := 'super_admin'::app_role;
    user_company_id := NULL;
    
    -- Log this important event
    INSERT INTO security_events (
      user_id,
      event_type,
      event_details,
      risk_score
    ) VALUES (
      NEW.id,
      'super_admin_created',
      jsonb_build_object(
        'email', NEW.email,
        'created_at', now(),
        'is_first_user', true
      ),
      0
    );
  ELSE
    -- For subsequent users, check metadata or default to company_admin
    user_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'company_admin'::app_role
    );
    
    -- If this is a company_admin, create a company for them
    IF user_role = 'company_admin' THEN
      -- Get company info from user metadata
      SELECT 
        COALESCE((NEW.raw_user_meta_data->>'company_name'), 'New Company'),
        COALESCE((NEW.raw_user_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type)
      INTO company_name, subscription_type;
      
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
        company_name,
        subscription_type,
        CASE 
          WHEN subscription_type = 'trial' THEN now() 
          ELSE NULL 
        END,
        CASE 
          WHEN subscription_type = 'trial' THEN trial_end_date 
          ELSE NULL 
        END,
        NEW.id,
        true
      )
      RETURNING id INTO new_company_id;
      
      user_company_id := new_company_id;
    ELSE
      -- For other roles, get company_id from metadata
      user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    END IF;
  END IF;

  -- Create the profile (without role)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_company_id
  );
  
  -- Create user role entry
  INSERT INTO public.user_roles (
    user_id,
    role,
    company_id
  )
  VALUES (
    NEW.id,
    user_role,
    user_company_id
  );
  
  RETURN NEW;
END;
$function$;