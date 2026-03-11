-- =====================================================================
-- Career Page v3: work_modality em jobs + seniority na view pública
-- 2026-03-11
-- =====================================================================

-- ── 1. Adicionar colunas à tabela jobs ───────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary_range TEXT,
  ADD COLUMN IF NOT EXISTS work_modality TEXT
    CHECK (work_modality IN ('presencial', 'hibrido', 'remoto'));

COMMENT ON COLUMN jobs.salary_range   IS 'Faixa salarial exibida na career page, ex: "R$ 5.000 – R$ 8.000" ou "A combinar"';
COMMENT ON COLUMN jobs.work_modality  IS 'Modalidade de trabalho: presencial | hibrido | remoto';

-- ── 2. Recriar v_public_jobs com work_modality + seniority ────────
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
  j.seniority::TEXT          AS seniority,
  j.salary_range,
  j.benefits,
  j.requirements,
  j.application_deadline,
  j.created_at,
  o.name                     AS org_name,
  o.slug                     AS org_slug,
  o.industry                 AS org_industry,
  o.logo_url                 AS org_logo_url,
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

COMMENT ON VIEW v_public_jobs IS 'Vagas públicas com work_modality e seniority — sem RLS (leitura pública)';

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
