-- =====================================================================
-- Career Page Typography: adiciona seleção de família de fonte por seção
-- Sprint 60 — 2026-03-24
-- Seções: hero | about | jobs | talent | testimonials | process
-- Fontes suportadas: inter | poppins | roboto | montserrat | lato |
--                   raleway | nunito | playfair | merriweather
-- =====================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS career_page_hero_font_family         TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS career_page_about_font_family        TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS career_page_jobs_font_family         TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS career_page_talent_font_family       TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS career_page_testimonials_font_family TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS career_page_process_font_family      TEXT DEFAULT 'inter';

-- ── Recriar v_public_jobs incluindo as novas colunas de família de fonte ──
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
  -- Tipografia por seção — cor, alinhamento, tamanho
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
  o.career_page_process_font_size,
  -- Tipografia por seção — família de fonte
  o.career_page_hero_font_family,
  o.career_page_about_font_family,
  o.career_page_jobs_font_family,
  o.career_page_talent_font_family,
  o.career_page_testimonials_font_family,
  o.career_page_process_font_family
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE
  j.is_public    = TRUE
  AND j.status   = 'open'
  AND o.career_page_enabled = TRUE;

-- RLS na view (herda da tabela base, mas garantimos acesso público)
GRANT SELECT ON v_public_jobs TO anon, authenticated;

-- ── Recriar funções RPC que dependem da view (derrubadas pelo CASCADE) ──
CREATE OR REPLACE FUNCTION get_public_jobs_by_org(p_org_slug TEXT)
RETURNS SETOF v_public_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM v_public_jobs WHERE org_slug = p_org_slug;
$$;

GRANT EXECUTE ON FUNCTION get_public_jobs_by_org(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_jobs_by_org(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_all_public_jobs()
RETURNS SETOF v_public_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM v_public_jobs ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_all_public_jobs() TO anon;
GRANT EXECUTE ON FUNCTION get_all_public_jobs() TO authenticated;

