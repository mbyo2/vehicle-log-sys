-- Create storage policies for company-logos bucket
-- Note: Storage policies are created on storage.objects table for specific buckets

-- Policy: Anyone can view company logos (public bucket)
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Policy: Authenticated users can upload their company's logo
CREATE POLICY "Users can upload their company logo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' 
  AND (
    -- File name should start with the company ID they have access to
    name ~ ('^' || (
      SELECT string_agg(id::text, '|')
      FROM companies 
      WHERE id IN (
        SELECT company_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('company_admin', 'super_admin')
      )
    ) || '-logo\.')
    OR
    -- Super admins can upload any logo
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);

-- Policy: Authenticated users can update their company's logo
CREATE POLICY "Users can update their company logo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    name ~ ('^' || (
      SELECT string_agg(id::text, '|')
      FROM companies 
      WHERE id IN (
        SELECT company_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('company_admin', 'super_admin')
      )
    ) || '-logo\.')
    OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);

-- Policy: Authenticated users can delete their company's logo
CREATE POLICY "Users can delete their company logo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    name ~ ('^' || (
      SELECT string_agg(id::text, '|')
      FROM companies 
      WHERE id IN (
        SELECT company_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('company_admin', 'super_admin')
      )
    ) || '-logo\.')
    OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  )
);

-- Create a function to clean up old company logo files
CREATE OR REPLACE FUNCTION public.cleanup_old_company_logo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_logo_path text;
BEGIN
  -- Extract the file path from the old logo_url
  IF OLD.logo_url IS NOT NULL AND NEW.logo_url IS DISTINCT FROM OLD.logo_url THEN
    -- Extract filename from URL (last segment after /)
    old_logo_path := substring(OLD.logo_url from '[^/]+$');
    
    IF old_logo_path IS NOT NULL THEN
      -- Delete the old logo file from storage
      DELETE FROM storage.objects
      WHERE bucket_id = 'company-logos'
      AND name = old_logo_path;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically cleanup old logos when company logo_url is updated
DROP TRIGGER IF EXISTS cleanup_old_company_logo_trigger ON companies;
CREATE TRIGGER cleanup_old_company_logo_trigger
  AFTER UPDATE OF logo_url ON companies
  FOR EACH ROW
  WHEN (OLD.logo_url IS DISTINCT FROM NEW.logo_url)
  EXECUTE FUNCTION public.cleanup_old_company_logo();