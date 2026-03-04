-- Add cargo/work tracking to trip_logs
ALTER TABLE public.trip_logs ADD COLUMN IF NOT EXISTS cargo_description text;
ALTER TABLE public.trip_logs ADD COLUMN IF NOT EXISTS cargo_weight_kg numeric;
ALTER TABLE public.trip_logs ADD COLUMN IF NOT EXISTS work_order_number text;
ALTER TABLE public.trip_logs ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.trip_logs ADD COLUMN IF NOT EXISTS delivery_address text;

-- Add same to vehicle_logs  
ALTER TABLE public.vehicle_logs ADD COLUMN IF NOT EXISTS cargo_description text;
ALTER TABLE public.vehicle_logs ADD COLUMN IF NOT EXISTS cargo_weight_kg numeric;
ALTER TABLE public.vehicle_logs ADD COLUMN IF NOT EXISTS work_order_number text;
ALTER TABLE public.vehicle_logs ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.vehicle_logs ADD COLUMN IF NOT EXISTS delivery_address text;

-- Add fuel_type to fuel_logs for better tracking
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS fuel_type text DEFAULT 'diesel';
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS station_name text;
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id);
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS receipt_image_path text;

-- Super admin can manage all fuel logs
CREATE POLICY "Super admins can manage fuel logs" ON public.fuel_logs
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Company admins can manage their fuel logs
CREATE POLICY "Company admins can manage fuel logs" ON public.fuel_logs
FOR ALL USING (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
WITH CHECK (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id());