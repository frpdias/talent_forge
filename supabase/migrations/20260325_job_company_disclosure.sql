-- Migration: Company Disclosure on Jobs
-- Adds ability for recruiters to reveal or keep confidential the company identity per job posting

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS company_disclosed  BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name       TEXT,
  ADD COLUMN IF NOT EXISTS company_logo_url   TEXT;

COMMENT ON COLUMN jobs.company_disclosed  IS 'When true, company_name and company_logo_url are shown publicly. When false, the company is kept confidential.';
COMMENT ON COLUMN jobs.company_name       IS 'Company name to display when company_disclosed = true';
COMMENT ON COLUMN jobs.company_logo_url   IS 'Public URL of the company logo to display when company_disclosed = true';

-- Bucket público para logos de empresas nas vagas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-logos',
  'job-logos',
  true,
  2097152, -- 2MB
  ARRAY['image/png','image/jpeg','image/jpg','image/svg+xml','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: upload restrito a membros da org (path: job-logos/[orgId]/...)
CREATE POLICY "job-logos authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-logos'
    AND auth.uid() IS NOT NULL
    AND is_org_member((storage.foldername(name))[1]::UUID)
  );

-- Política: update restrito a membros da org
CREATE POLICY "job-logos authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'job-logos'
    AND is_org_member((storage.foldername(name))[1]::UUID)
  );

-- Política: delete restrito a membros da org
CREATE POLICY "job-logos authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'job-logos'
    AND is_org_member((storage.foldername(name))[1]::UUID)
  );

-- Política: leitura pública (bucket público)
CREATE POLICY "job-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-logos');
