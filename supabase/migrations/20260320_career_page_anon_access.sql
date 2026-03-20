-- Migration: permitir acesso anônimo a orgs com career page pública ativa
-- Problema: organizations_select exige auth.uid(), bloqueando vistas anônimas
-- da career page mesmo quando career_page_enabled=TRUE e status='active'.
-- Solução: policy adicional que permite SELECT anon em orgs públicas.

-- Política de leitura pública para orgs com career page habilitada
DROP POLICY IF EXISTS organizations_public_career_page ON organizations;

CREATE POLICY organizations_public_career_page ON organizations
  FOR SELECT
  USING (
    career_page_enabled = TRUE
    AND status = 'active'
  );

COMMENT ON POLICY organizations_public_career_page ON organizations
  IS 'Permite leitura anônima de orgs com career page pública ativa (career_page_enabled=TRUE, status=active). Expõe apenas dados de orgs que optaram por ser públicas.';
