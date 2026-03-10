-- =====================================================================
-- organizations: coluna org_type para separar empresas de recrutadores
-- 2026-03-10
-- =====================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'company'
  CHECK (org_type IN ('company', 'recruiter'));

COMMENT ON COLUMN organizations.org_type IS 'Tipo da organização: company (empresa cliente) ou recruiter (agência/headhunter)';

-- Índice para filtros por tipo
CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON organizations (org_type);
