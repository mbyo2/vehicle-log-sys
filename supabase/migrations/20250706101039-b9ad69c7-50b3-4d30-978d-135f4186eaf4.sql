-- Create essential tables for fleet management (fixed version)

-- Create vehicles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    license_plate text NOT NULL,
    vin text,
    fuel_type text DEFAULT 'petrol',
    current_kilometers integer DEFAULT 0,
    status text DEFAULT 'active',
    assigned_driver_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_company_license_unique') THEN
        ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_company_license_unique UNIQUE(company_id, license_plate);
    END IF;
END $$;

-- Add check constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_status_check') THEN
        ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_status_check CHECK (status IN ('active', 'maintenance', 'retired'));
    END IF;
END $$;

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their company's vehicles" ON vehicles;
CREATE POLICY "Users can view their company's vehicles" ON vehicles
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Company admins can manage vehicles" ON vehicles;
CREATE POLICY "Company admins can manage vehicles" ON vehicles
  FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND COALESCE(public.get_user_role(), 'driver') IN ('company_admin', 'supervisor')
  );

-- Create trips table for basic trip logging
CREATE TABLE IF NOT EXISTS public.trips (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    driver_id uuid NOT NULL,
    start_date timestamp with time zone NOT NULL DEFAULT now(),
    end_date timestamp with time zone,
    start_location text NOT NULL,
    end_location text,
    start_kilometers integer NOT NULL,
    end_kilometers integer,
    purpose text,
    status text DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add check constraint for trips status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_status_check') THEN
        ALTER TABLE public.trips ADD CONSTRAINT trips_status_check CHECK (status IN ('active', 'completed', 'cancelled'));
    END IF;
END $$;

-- Enable RLS on trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create policies for trips
DROP POLICY IF EXISTS "Users can view their company's trips" ON trips;
CREATE POLICY "Users can view their company's trips" ON trips
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can manage their own trips" ON trips;
CREATE POLICY "Drivers can manage their own trips" ON trips
  FOR ALL USING (
    driver_id = auth.uid()
    OR (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        AND COALESCE(public.get_user_role(), 'driver') IN ('company_admin', 'supervisor'))
  );

-- Create training_courses table for driver training
CREATE TABLE IF NOT EXISTS public.training_courses (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    course_name text NOT NULL,
    description text,
    duration_hours integer,
    is_mandatory boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on training_courses
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

-- Create policies for training_courses
DROP POLICY IF EXISTS "Users can view their company's training courses" ON training_courses;
CREATE POLICY "Users can view their company's training courses" ON training_courses
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Company admins can manage training courses" ON training_courses;
CREATE POLICY "Company admins can manage training courses" ON training_courses
  FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND COALESCE(public.get_user_role(), 'driver') IN ('company_admin', 'supervisor')
  );

-- Create vehicle_services table for maintenance tracking
CREATE TABLE IF NOT EXISTS public.vehicle_services (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    service_type text NOT NULL,
    service_date timestamp with time zone NOT NULL,
    cost numeric DEFAULT 0,
    description text,
    service_provider text,
    kilometers_at_service integer,
    next_service_due timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on vehicle_services
ALTER TABLE public.vehicle_services ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_services
DROP POLICY IF EXISTS "Users can view their company's vehicle services" ON vehicle_services;
CREATE POLICY "Users can view their company's vehicle services" ON vehicle_services
  FOR SELECT USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Company admins can manage vehicle services" ON vehicle_services;
CREATE POLICY "Company admins can manage vehicle services" ON vehicle_services
  FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND COALESCE(public.get_user_role(), 'driver') IN ('company_admin', 'supervisor')
  );

-- Add foreign key constraints with proper checks
DO $$
BEGIN
    -- Add vehicles company constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_company_id_fkey') THEN
        ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_company_id_fkey 
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    
    -- Add trips constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_company_id_fkey') THEN
        ALTER TABLE public.trips ADD CONSTRAINT trips_company_id_fkey 
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_vehicle_id_fkey') THEN
        ALTER TABLE public.trips ADD CONSTRAINT trips_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add training courses constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'training_courses_company_id_fkey') THEN
        ALTER TABLE public.training_courses ADD CONSTRAINT training_courses_company_id_fkey 
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    
    -- Add vehicle services constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_services_company_id_fkey') THEN
        ALTER TABLE public.vehicle_services ADD CONSTRAINT vehicle_services_company_id_fkey 
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_services_vehicle_id_fkey') THEN
        ALTER TABLE public.vehicle_services ADD CONSTRAINT vehicle_services_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for timestamp updates (drop existing first)
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_courses_updated_at ON training_courses;
CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON training_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_services_updated_at ON vehicle_services;
CREATE TRIGGER update_vehicle_services_updated_at BEFORE UPDATE ON vehicle_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();