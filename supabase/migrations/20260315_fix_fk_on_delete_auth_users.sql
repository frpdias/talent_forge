-- Fix: FK references to auth.users sem ON DELETE — causavam erro 500 ao excluir usuário
-- Estratégia: SET NULL para colunas anuláveis, CASCADE para NOT NULL
-- Cada bloco é independente para não parar no primeiro erro
-- Data: 2026-03-15

-- ─── assessment_invitations (invited_by NOT NULL → CASCADE) ──────────────────
DO $$ BEGIN
  ALTER TABLE assessment_invitations DROP CONSTRAINT IF EXISTS assessment_invitations_invited_by_fkey;
  ALTER TABLE assessment_invitations ADD CONSTRAINT assessment_invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'assessment_invitations: %', SQLERRM;
END $$;

-- ─── copc_metric_entries ──────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE copc_metric_entries DROP CONSTRAINT IF EXISTS copc_metric_entries_created_by_fkey;
  ALTER TABLE copc_metric_entries ADD CONSTRAINT copc_metric_entries_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'copc_metric_entries: %', SQLERRM;
END $$;

-- ─── application_documents ───────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE application_documents DROP CONSTRAINT IF EXISTS application_documents_uploaded_by_fkey;
  ALTER TABLE application_documents ADD CONSTRAINT application_documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'application_documents: %', SQLERRM;
END $$;

-- ─── interviews ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_created_by_fkey;
  ALTER TABLE interviews ADD CONSTRAINT interviews_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'interviews: %', SQLERRM;
END $$;

-- ─── nr1_assessment_invitations ───────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE nr1_assessment_invitations DROP CONSTRAINT IF EXISTS nr1_assessment_invitations_invited_by_fkey;
  ALTER TABLE nr1_assessment_invitations ADD CONSTRAINT nr1_assessment_invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'nr1_assessment_invitations: %', SQLERRM;
END $$;

-- ─── recruitment_module_activations ──────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE recruitment_module_activations DROP CONSTRAINT IF EXISTS recruitment_module_activations_activated_by_fkey;
  ALTER TABLE recruitment_module_activations ADD CONSTRAINT recruitment_module_activations_activated_by_fkey
    FOREIGN KEY (activated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'recruitment_module_activations: %', SQLERRM;
END $$;

-- ─── invitations ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;
  ALTER TABLE invitations ADD CONSTRAINT invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'invitations: %', SQLERRM;
END $$;

-- ─── php_module_activations ───────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE php_module_activations DROP CONSTRAINT IF EXISTS php_module_activations_activated_by_fkey;
  ALTER TABLE php_module_activations ADD CONSTRAINT php_module_activations_activated_by_fkey
    FOREIGN KEY (activated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'php_module_activations: %', SQLERRM;
END $$;

-- ─── teams ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_manager_id_fkey;
  ALTER TABLE teams ADD CONSTRAINT teams_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'teams: %', SQLERRM;
END $$;

-- ─── tfci_cycles ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE tfci_cycles DROP CONSTRAINT IF EXISTS tfci_cycles_created_by_fkey;
  ALTER TABLE tfci_cycles ADD CONSTRAINT tfci_cycles_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'tfci_cycles: %', SQLERRM;
END $$;

-- ─── nr1_risk_assessments ─────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE nr1_risk_assessments DROP CONSTRAINT IF EXISTS nr1_risk_assessments_assessed_by_fkey;
  ALTER TABLE nr1_risk_assessments ADD CONSTRAINT nr1_risk_assessments_assessed_by_fkey
    FOREIGN KEY (assessed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'nr1_risk_assessments: %', SQLERRM;
END $$;

-- ─── copc_metrics ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE copc_metrics DROP CONSTRAINT IF EXISTS copc_metrics_created_by_fkey;
  ALTER TABLE copc_metrics ADD CONSTRAINT copc_metrics_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'copc_metrics: %', SQLERRM;
END $$;

-- ─── php_action_plans ─────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE php_action_plans DROP CONSTRAINT IF EXISTS php_action_plans_assigned_to_fkey;
  ALTER TABLE php_action_plans ADD CONSTRAINT php_action_plans_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'php_action_plans assigned_to: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE php_action_plans DROP CONSTRAINT IF EXISTS php_action_plans_created_by_fkey;
  ALTER TABLE php_action_plans ADD CONSTRAINT php_action_plans_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'php_action_plans created_by: %', SQLERRM;
END $$;

-- ─── php_action_items ─────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE php_action_items DROP CONSTRAINT IF EXISTS php_action_items_assigned_to_fkey;
  ALTER TABLE php_action_items ADD CONSTRAINT php_action_items_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'php_action_items: %', SQLERRM;
END $$;
