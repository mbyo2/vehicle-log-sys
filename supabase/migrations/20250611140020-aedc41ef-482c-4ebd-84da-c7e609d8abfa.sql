
-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('documents', 'documents', false),
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents bucket (private)
CREATE POLICY "Users can upload documents to their company" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view documents from their company" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents from their company" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents from their company" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
  );

-- Create storage policies for avatars bucket (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for company logos bucket (public)
CREATE POLICY "Anyone can view company logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Company admins can manage their company logo" ON storage.objects
  FOR ALL USING (
    bucket_id = 'company-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM profiles 
      WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin')
    )
  );

-- Update documents table to include file URLs and sizes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Add expiry date column to documents if not exists
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read documents from their company" ON documents
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Company admins can manage documents in their company" ON documents
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'company_admin')
  );

-- Add vehicle_id and driver_id foreign key relationships for documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);
