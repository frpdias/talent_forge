-- =====================================================================
-- Career Page Typography: cor de fonte, alinhamento e tamanho por seção
-- Sprint 58 — 2026-03-21
-- Seções: hero | about | jobs | talent | testimonials | process
-- =====================================================================

ALTER TABLE organizations
  -- HERO
  ADD COLUMN IF NOT EXISTS career_page_hero_font_color         TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS career_page_hero_text_align         TEXT DEFAULT 'right',
  ADD COLUMN IF NOT EXISTS career_page_hero_font_size          TEXT DEFAULT 'md',
  -- SOBRE A EMPRESA
  ADD COLUMN IF NOT EXISTS career_page_about_font_color        TEXT DEFAULT '#374151',
  ADD COLUMN IF NOT EXISTS career_page_about_text_align        TEXT DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS career_page_about_font_size         TEXT DEFAULT 'md',
  -- VAGAS
  ADD COLUMN IF NOT EXISTS career_page_jobs_font_color         TEXT DEFAULT '#141042',
  ADD COLUMN IF NOT EXISTS career_page_jobs_text_align         TEXT DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS career_page_jobs_font_size          TEXT DEFAULT 'md',
  -- BANCO DE TALENTOS
  ADD COLUMN IF NOT EXISTS career_page_talent_font_color       TEXT DEFAULT '#141042',
  ADD COLUMN IF NOT EXISTS career_page_talent_text_align       TEXT DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS career_page_talent_font_size        TEXT DEFAULT 'md',
  -- DEPOIMENTOS
  ADD COLUMN IF NOT EXISTS career_page_testimonials_font_color TEXT DEFAULT '#141042',
  ADD COLUMN IF NOT EXISTS career_page_testimonials_text_align TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS career_page_testimonials_font_size  TEXT DEFAULT 'md',
  -- PROCESSO SELETIVO / DICAS
  ADD COLUMN IF NOT EXISTS career_page_process_font_color      TEXT DEFAULT '#141042',
  ADD COLUMN IF NOT EXISTS career_page_process_text_align      TEXT DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS career_page_process_font_size       TEXT DEFAULT 'md';

-- ── Recriar v_public_jobs incluindo as novas colunas de tipografia ──
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
  j.work_modality,
  j.seniority::TEXT              AS seniority,
  j.salary_range,
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
  o.career_page_show_contact,
  -- Tipografia por seção
  o.career_page_hero_font_color,
  o.career_page_hero_text_align,
  o.career_page_hero_font_size,
  o.career_page_about_font_color,
  o.career_page_about_text_align,
  o.career_page_about_font_size,
  o.career_page_jobs_font_color,
  o.career_page_jobs_text_align,
  o.career_page_jobs_font_size,
  o.career_page_talent_font_color,
  o.career_page_talent_text_align,
  o.career_page_talent_font_size,
  o.career_page_testimonials_font_color,
  o.career_page_testimonials_text_align,
  o.career_page_testimonials_font_size,
  o.career_page_process_font_color,
  o.career_page_process_text_align,
  o.career_page_process_font_size
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE
  j.is_public    = TRUE
  AND j.status   = 'open'
  AND o.career_page_enabled = TRUE
  AND o.status   = 'active';

COMMENT ON VIEW v_public_jobs IS
  'Vagas públicas com tipografia por seção — Sprint 58';

-- ── Recriar RPC (corpo inalterado — SELECT * já inclui novos campos) ──
CREATE OR REPLACE FUNCTION get_public_jobs_by_org(p_org_slug TEXT)
RETURNS SETOF v_public_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM v_public_jobs WHERE org_slug = p_org_slug;
$$;

COMMENT ON FUNCTION get_public_jobs_by_org IS
  'Retorna vagas públicas de uma org pelo slug — SECURITY DEFINER, sem autenticação necessária';
