-- =====================================================================
-- Sprint A v2: Career Page Pública — campos estendidos
-- Banner, About, cor secundária, links sociais, storage bucket
-- 2026-03-07
-- =====================================================================

-- ── 1. Novas colunas em organizations ─────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS career_page_banner_url       TEXT,
  ADD COLUMN IF NOT EXISTS career_page_about            TEXT,
  ADD COLUMN IF NOT EXISTS career_page_secondary_color  TEXT  DEFAULT '#10B981',
  ADD COLUMN IF NOT EXISTS career_page_whatsapp_url     TEXT,
  ADD COLUMN IF NOT EXISTS career_page_instagram_url    TEXT,
  ADD COLUMN IF NOT EXISTS career_page_linkedin_url     TEXT,
  ADD COLUMN IF NOT EXISTS career_page_show_contact     BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN organizations.career_page_banner_url      IS 'URL da imagem de banner da career page (Supabase Storage ou CDN)';
COMMENT ON COLUMN organizations.career_page_about           IS 'Texto "sobre a empresa" exibido na career page';
COMMENT ON COLUMN organizations.career_page_secondary_color IS 'Cor secundária da career page (hex, default #10B981)';
COMMENT ON COLUMN organizations.career_page_whatsapp_url    IS 'Link WhatsApp para contato na career page';
COMMENT ON COLUMN organizations.career_page_instagram_url   IS 'Link Instagram da empresa';
COMMENT ON COLUMN organizations.career_page_linkedin_url    IS 'Link LinkedIn da empresa';
COMMENT ON COLUMN organizations.career_page_show_contact    IS 'Exibir links de contato/redes na career page';

-- ── 2. Recriar view v_public_jobs com novos campos ─────────────────
DROP VIEW IF EXISTS v_public_jobs CASCADE;

CREATE VIEW v_public_jobs AS
SELECT
  j.id,
  j.org_id,
  j.title,
  j.description,
  j.description_html,
  j.location,
  j.employment_type,
  j.benefits,
  j.requirements,
  j.application_deadline,
  j.created_at,
  o.name                         AS org_name,
  o.slug                         AS org_slug,
  o.industry                     AS org_industry,
  o.logo_url                     AS org_logo_url,
  o.career_page_headline,
  o.career_page_logo_url,
  o.career_page_color,
  o.career_page_secondary_color,
  o.career_page_banner_url,
  o.career_page_about,
  o.career_page_whatsapp_url,
  o.career_page_instagram_url,
  o.career_page_linkedin_url,
  o.career_page_show_contact
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE
  j.is_public = TRUE
  AND j.status = 'open'
  AND o.career_page_enabled = TRUE
  AND o.status = 'active';

COMMENT ON VIEW v_public_jobs IS 'Vagas públicas de orgs com career page habilitada — sem RLS (leitura pública)';

-- ── 3. Recriar RPC get_public_jobs_by_org ─────────────────────────
CREATE OR REPLACE FUNCTION get_public_jobs_by_org(p_org_slug TEXT)
RETURNS SETOF v_public_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM v_public_jobs WHERE org_slug = p_org_slug;
$$;

COMMENT ON FUNCTION get_public_jobs_by_org IS 'Retorna vagas públicas de uma org pelo slug — SECURITY DEFINER, sem autenticação necessária';

-- ── 4. Storage bucket org-assets ──────────────────────────────────
-- Bucket público para logos e banners de organizações
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-assets',
  'org-assets',
  TRUE,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: leitura pública
CREATE POLICY "org-assets public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-assets');

-- Policy: upload por membros autenticados (org-assets/[orgId]/...)
CREATE POLICY "org-assets authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-assets'
  AND auth.uid() IS NOT NULL
  AND is_org_member((storage.foldername(name))[1]::UUID)
);

-- Policy: update/delete por membros autenticados
CREATE POLICY "org-assets authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-assets'
  AND is_org_member((storage.foldername(name))[1]::UUID)
);

CREATE POLICY "org-assets authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-assets'
  AND is_org_member((storage.foldername(name))[1]::UUID)
);
