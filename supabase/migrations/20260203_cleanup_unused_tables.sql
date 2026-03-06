-- Migration: Limpeza de tabelas não utilizadas
-- Data: 2026-02-03
-- Descrição: Remove tabelas que foram criadas mas nunca utilizadas na aplicação
--
-- TABELAS REMOVIDAS:
-- 1. candidate_saved_jobs - Funcionalidade de "salvar vaga" nunca implementada
-- 2. candidate_applications_view - View materializada abandonada
-- 3. invitations - Substituída por candidate_invite_links
-- 4. employee_reports - Estrutura de hierarquia não implementada
--
-- TABELAS QUE NÃO EXISTIAM (conforme verificação no Supabase):
-- - tenants (nunca criada - usar organizations)
-- - tenant_users (nunca criada - usar org_members)

-- =====================================================
-- REMOÇÃO DE TABELAS NÃO UTILIZADAS
-- =====================================================

-- 1. candidate_saved_jobs - Zero uso no código
DROP TABLE IF EXISTS candidate_saved_jobs CASCADE;

-- 2. candidate_applications_view - Zero uso no código
DROP TABLE IF EXISTS candidate_applications_view CASCADE;

-- 3. invitations - Substituída por candidate_invite_links (6 refs vs 0 refs)
DROP TABLE IF EXISTS invitations CASCADE;

-- 4. employee_reports - Estrutura de hierarquia não implementada
DROP TABLE IF EXISTS employee_reports CASCADE;

-- =====================================================
-- DOCUMENTAÇÃO: TABELAS MANTIDAS (com justificativa)
-- =====================================================

-- teams / team_members:
--   Status: Zero uso atual
--   Decisão: MANTER - planejado para futuro (agrupamento de employees)
--   Alternativa atual: employees.department + employees.manager_id

-- companies:
--   Status: Usado apenas no admin panel
--   Decisão: MANTER - propósito diferente de organizations
--     - organizations = tenant operacional (login, permissões)
--     - companies = dados cadastrais (CNPJ, filiais)

-- php_integrated_scores / php_action_items:
--   Status: Zero uso atual
--   Decisão: MANTER - parte do módulo PHP (implementação futura)

-- =====================================================
-- VALIDAÇÃO PÓS-MIGRATION
-- =====================================================

-- Verificar que tabelas foram removidas:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('candidate_saved_jobs', 'candidate_applications_view', 'invitations', 'employee_reports');
-- Esperado: 0 rows

-- =====================================================
-- LOG
-- =====================================================
-- Executado em: 2026-02-03
-- Resultado: SUCCESS (4 tabelas removidas)
-- Nota: tenants e tenant_users já não existiam no banco
