-- =====================================================================
-- Sprint A: Career Page Pública
-- Campos para página de carreiras por organização + vagas públicas
-- 2026-03-06
-- =====================================================================

-- ── 1. Colunas em jobs ─────────────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,          -- vaga visível na career page
  ADD COLUMN IF NOT EXISTS description_html TEXT,                              -- descrição rich-text (HTML)
  ADD COLUMN IF NOT EXISTS application_deadline DATE;                          -- prazo para candidatura

CREATE INDEX IF NOT EXISTS jobs_public_idx ON jobs(org_id, is_public)
  WHERE is_public = TRUE;

COMMENT ON COLUMN jobs.is_public IS 'Vaga visível na career page pública da organização';
COMMENT ON COLUMN jobs.description_html IS 'Descrição da vaga em HTML (versão rich-text para career page)';
COMMENT ON COLUMN jobs.application_deadline IS 'Data limite para candidatura (NULL = sem prazo)';

-- ── 2. Colunas em organizations ────────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS career_page_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- habilitar career page
  ADD COLUMN IF NOT EXISTS career_page_headline TEXT,                           -- título hero da career page
  ADD COLUMN IF NOT EXISTS career_page_logo_url TEXT,                          -- logo exibido na career page
  ADD COLUMN IF NOT EXISTS career_page_color TEXT DEFAULT '#141042';            -- cor primária da career page

COMMENT ON COLUMN organizations.career_page_enabled IS 'Habilita a career page pública para candidatos externos';
COMMENT ON COLUMN organizations.career_page_headline IS 'Título exibido no hero da career page';
COMMENT ON COLUMN organizations.career_page_logo_url IS 'URL do logo para career page (Supabase Storage ou CDN)';
COMMENT ON COLUMN organizations.career_page_color IS 'Cor primária da career page (hex, default #141042)';

-- ── 3. View pública de vagas ────────────────────────────────────────
-- Retorna vagas públicas de orgs com career page habilitada
-- RLS não se aplica a views — controle feito via is_public e career_page_enabled
DROP VIEW IF EXISTS v_public_jobs;

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
  o.name        AS org_name,
  o.slug        AS org_slug,
  o.industry    AS org_industry,
  o.career_page_headline,
  o.career_page_logo_url,
  o.career_page_color
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE
  j.is_public = TRUE
  AND j.status = 'open'
  AND o.career_page_enabled = TRUE
  AND o.status = 'active';

COMMENT ON VIEW v_public_jobs IS 'Vagas públicas de orgs com career page habilitada — sem RLS (leitura pública)';

-- ── 4. RPC get_public_jobs_by_org(p_org_slug) ──────────────────────
-- Retorna vagas públicas de uma org específica pelo slug
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
