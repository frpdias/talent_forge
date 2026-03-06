-- ============================================================================
-- Migration: Consolidação de RLS para tabelas do módulo PHP
-- Data: 2026-02-03
-- Descrição: Remove políticas duplicadas/conflitantes e cria um conjunto
--            consistente de políticas RLS para todas as tabelas do módulo PHP
-- ============================================================================

-- ============================================================================
-- PARTE 1: Limpar políticas conflitantes de php_module_activations
-- ============================================================================

DROP POLICY IF EXISTS "admin_manage_php_activation" ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_select ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_insert ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_update ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_delete ON php_module_activations;

ALTER TABLE php_module_activations ENABLE ROW LEVEL SECURITY;

-- SELECT: Membros ativos da org podem ver
CREATE POLICY php_activations_select ON php_module_activations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = php_module_activations.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Apenas admins da org
CREATE POLICY php_activations_insert ON php_module_activations
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

-- UPDATE: Apenas admins da org
CREATE POLICY php_activations_update ON php_module_activations
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

-- DELETE: Apenas admins da org
CREATE POLICY php_activations_delete ON php_module_activations
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

GRANT SELECT ON php_module_activations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON php_module_activations TO authenticated;

-- ============================================================================
-- PARTE 2: Limpar e recriar políticas para tfci_cycles
-- ============================================================================

DROP POLICY IF EXISTS "members_view_tfci_cycles" ON tfci_cycles;
DROP POLICY IF EXISTS "admins_manage_tfci_cycles" ON tfci_cycles;
DROP POLICY IF EXISTS tfci_cycles_select ON tfci_cycles;
DROP POLICY IF EXISTS tfci_cycles_insert ON tfci_cycles;
DROP POLICY IF EXISTS tfci_cycles_update ON tfci_cycles;
DROP POLICY IF EXISTS tfci_cycles_delete ON tfci_cycles;

ALTER TABLE tfci_cycles ENABLE ROW LEVEL SECURITY;

-- SELECT: Membros ativos da org podem ver
CREATE POLICY tfci_cycles_select ON tfci_cycles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = tfci_cycles.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Membros podem criar
CREATE POLICY tfci_cycles_insert ON tfci_cycles
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tfci_cycles.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- UPDATE: Admins/Managers podem atualizar
CREATE POLICY tfci_cycles_update ON tfci_cycles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tfci_cycles.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

-- DELETE: Apenas admins
CREATE POLICY tfci_cycles_delete ON tfci_cycles
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tfci_cycles.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

GRANT SELECT ON tfci_cycles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tfci_cycles TO authenticated;

-- ============================================================================
-- PARTE 3: Políticas para php_action_plans
-- ============================================================================

DROP POLICY IF EXISTS "members_view_action_plans" ON php_action_plans;
DROP POLICY IF EXISTS "managers_manage_action_plans" ON php_action_plans;
DROP POLICY IF EXISTS php_action_plans_select ON php_action_plans;
DROP POLICY IF EXISTS php_action_plans_insert ON php_action_plans;
DROP POLICY IF EXISTS php_action_plans_update ON php_action_plans;
DROP POLICY IF EXISTS php_action_plans_delete ON php_action_plans;

ALTER TABLE php_action_plans ENABLE ROW LEVEL SECURITY;

-- SELECT: Membros ativos da org podem ver
CREATE POLICY php_action_plans_select ON php_action_plans
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = php_action_plans.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Membros podem criar
CREATE POLICY php_action_plans_insert ON php_action_plans
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_action_plans.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- UPDATE: Membros podem atualizar (quem criou ou está atribuído)
CREATE POLICY php_action_plans_update ON php_action_plans
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_action_plans.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- DELETE: Apenas admins
CREATE POLICY php_action_plans_delete ON php_action_plans
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_action_plans.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

GRANT SELECT ON php_action_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON php_action_plans TO authenticated;

-- ============================================================================
-- PARTE 4: Políticas para php_action_items
-- ============================================================================

DROP POLICY IF EXISTS "members_view_action_items" ON php_action_items;
DROP POLICY IF EXISTS "assigned_update_action_items" ON php_action_items;
DROP POLICY IF EXISTS php_action_items_select ON php_action_items;
DROP POLICY IF EXISTS php_action_items_insert ON php_action_items;
DROP POLICY IF EXISTS php_action_items_update ON php_action_items;
DROP POLICY IF EXISTS php_action_items_delete ON php_action_items;

ALTER TABLE php_action_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Membros da org do plano podem ver
CREATE POLICY php_action_items_select ON php_action_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM php_action_plans p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = php_action_items.action_plan_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Membros da org do plano podem inserir
CREATE POLICY php_action_items_insert ON php_action_items
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM php_action_plans p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = php_action_items.action_plan_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- UPDATE: Quem está atribuído ou membro da org
CREATE POLICY php_action_items_update ON php_action_items
  FOR UPDATE 
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM php_action_plans p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = php_action_items.action_plan_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- DELETE: Apenas admins da org
CREATE POLICY php_action_items_delete ON php_action_items
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM php_action_plans p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = php_action_items.action_plan_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

GRANT SELECT ON php_action_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON php_action_items TO authenticated;

-- ============================================================================
-- PARTE 5: Políticas para php_integrated_scores
-- ============================================================================

DROP POLICY IF EXISTS "members_view_php_scores" ON php_integrated_scores;
DROP POLICY IF EXISTS "system_insert_php_scores" ON php_integrated_scores;

ALTER TABLE php_integrated_scores ENABLE ROW LEVEL SECURITY;

-- SELECT: Membros ativos da org podem ver
CREATE POLICY php_scores_select ON php_integrated_scores
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = php_integrated_scores.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Membros podem inserir
CREATE POLICY php_scores_insert ON php_integrated_scores
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_integrated_scores.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

GRANT SELECT ON php_integrated_scores TO anon, authenticated;
GRANT INSERT ON php_integrated_scores TO authenticated;

-- ============================================================================
-- PARTE 6: Políticas para tfci_assessments
-- ============================================================================

DROP POLICY IF EXISTS "members_submit_tfci" ON tfci_assessments;
DROP POLICY IF EXISTS "managers_view_individual_tfci" ON tfci_assessments;

ALTER TABLE tfci_assessments ENABLE ROW LEVEL SECURITY;

-- SELECT: Membros ativos da org podem ver (com respeito a anonimato)
CREATE POLICY tfci_assessments_select ON tfci_assessments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = tfci_assessments.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Membros podem submeter
CREATE POLICY tfci_assessments_insert ON tfci_assessments
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tfci_assessments.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

GRANT SELECT ON tfci_assessments TO anon, authenticated;
GRANT INSERT ON tfci_assessments TO authenticated;

-- ============================================================================
-- PARTE 7: Políticas para nr1_risk_assessments
-- ============================================================================

DROP POLICY IF EXISTS "admins_hr_full_access_nr1" ON nr1_risk_assessments;
DROP POLICY IF EXISTS "users_view_own_nr1" ON nr1_risk_assessments;

ALTER TABLE nr1_risk_assessments ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins/HR veem todos, usuários veem próprios
CREATE POLICY nr1_assessments_select ON nr1_risk_assessments
  FOR SELECT 
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = nr1_risk_assessments.org_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager', 'hr')
      AND om.status = 'active'
    )
  );

-- INSERT: Admins/HR podem inserir
CREATE POLICY nr1_assessments_insert ON nr1_risk_assessments
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = nr1_risk_assessments.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager', 'hr')
      AND om.status = 'active'
    )
  );

-- UPDATE: Admins/HR podem atualizar
CREATE POLICY nr1_assessments_update ON nr1_risk_assessments
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = nr1_risk_assessments.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager', 'hr')
      AND om.status = 'active'
    )
  );

GRANT SELECT ON nr1_risk_assessments TO anon, authenticated;
GRANT INSERT, UPDATE ON nr1_risk_assessments TO authenticated;

-- ============================================================================
-- PARTE 8: Políticas para copc_metrics
-- ============================================================================

DROP POLICY IF EXISTS "managers_view_team_copc" ON copc_metrics;
DROP POLICY IF EXISTS "managers_insert_copc" ON copc_metrics;

ALTER TABLE copc_metrics ENABLE ROW LEVEL SECURITY;

-- SELECT: Membros ativos da org podem ver
CREATE POLICY copc_metrics_select ON copc_metrics
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = copc_metrics.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Admins/Managers podem inserir
CREATE POLICY copc_metrics_insert ON copc_metrics
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = copc_metrics.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

GRANT SELECT ON copc_metrics TO anon, authenticated;
GRANT INSERT ON copc_metrics TO authenticated;

-- ============================================================================
-- Verificação
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies for PHP module tables have been consolidated.';
  RAISE NOTICE 'Tables updated: php_module_activations, tfci_cycles, tfci_assessments,';
  RAISE NOTICE '               php_action_plans, php_action_items, php_integrated_scores,';
  RAISE NOTICE '               nr1_risk_assessments, copc_metrics';
END $$;
