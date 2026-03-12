-- ============================================================
-- Sprint 42 — Gate de Ativação do Módulo de Recrutamento
-- Segue o mesmo padrão de php_module_activations
-- ============================================================

CREATE TABLE IF NOT EXISTS recruitment_module_activations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  is_active      BOOLEAN DEFAULT FALSE,
  activated_at   TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  activated_by   UUID REFERENCES auth.users(id),
  settings       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT recruitment_module_activations_org_id_unique UNIQUE (org_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recruitment_activations_org_id
  ON recruitment_module_activations(org_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_activations_is_active
  ON recruitment_module_activations(is_active);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_recruitment_activations
  BEFORE UPDATE ON recruitment_module_activations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE recruitment_module_activations ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer membro ativo da org pode ver
CREATE POLICY recruitment_activations_select ON recruitment_module_activations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- INSERT: apenas admin ou manager da org
CREATE POLICY recruitment_activations_insert ON recruitment_module_activations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'manager')
        AND om.status = 'active'
    )
  );

-- UPDATE: apenas admin ou manager da org
CREATE POLICY recruitment_activations_update ON recruitment_module_activations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'manager')
        AND om.status = 'active'
    )
  );

-- DELETE: apenas admin da org
CREATE POLICY recruitment_activations_delete ON recruitment_module_activations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.status = 'active'
    )
  );

-- ============================================================
-- Ativação automática de todas as orgs ativas existentes
-- (evita quebrar clientes que já usam recrutamento hoje)
-- ============================================================
INSERT INTO recruitment_module_activations (org_id, is_active, activated_at)
SELECT id, true, NOW()
FROM organizations
WHERE status = 'active'
ON CONFLICT (org_id) DO NOTHING;
