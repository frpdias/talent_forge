-- =============================================================================
-- Migration: Restringir ativação de módulos apenas ao admin Fartech (service_role)
-- Sprint 56 — Correção de segurança: qualquer membro de org não pode mais
-- ativar/desativar módulos diretamente via SDK; apenas admins via API server-side.
-- =============================================================================

-- PHP MODULE ACTIVATIONS
-- Remover políticas de INSERT/UPDATE/DELETE que permitiam qualquer membro de org
DROP POLICY IF EXISTS php_activations_insert ON php_module_activations;
DROP POLICY IF EXISTS php_activations_update ON php_module_activations;
DROP POLICY IF EXISTS php_activations_delete ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_insert ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_update ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_delete ON php_module_activations;

-- Manter apenas SELECT para membros da org (para exibir status no UI)
-- INSERT/UPDATE/DELETE SOMENTE via service_role (rotas admin server-side)
-- service_role bypassa RLS automaticamente — não precisa de policy explícita

-- RECRUITMENT MODULE ACTIVATIONS
-- Mesma restrição: apenas SELECT para membros; escrita somente via service_role
DROP POLICY IF EXISTS recruitment_activations_insert ON recruitment_module_activations;
DROP POLICY IF EXISTS recruitment_activations_update ON recruitment_module_activations;
DROP POLICY IF EXISTS recruitment_activations_delete ON recruitment_module_activations;

-- Garantir que SELECT ainda funciona para membros da org (para status de módulo)
-- As políticas SELECT existentes são mantidas (não as removemos aqui)

-- Revogar permissão de INSERT/UPDATE/DELETE do role authenticated
REVOKE INSERT, UPDATE, DELETE ON php_module_activations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON recruitment_module_activations FROM authenticated;

-- Manter permissão de SELECT para authenticated (exibir status)
GRANT SELECT ON php_module_activations TO authenticated;
GRANT SELECT ON recruitment_module_activations TO authenticated;

-- Comentário de auditoria
COMMENT ON TABLE php_module_activations IS 
  'Ativações do módulo PHP por organização. Escrita restrita ao service_role (admin Fartech via API). SELECT liberado para membros da org.';

COMMENT ON TABLE recruitment_module_activations IS 
  'Ativações do módulo de Recrutamento por organização. Escrita restrita ao service_role (admin Fartech via API). SELECT liberado para membros da org.';
