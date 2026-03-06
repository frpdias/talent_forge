-- Validação das Melhorias Implementadas (Sprint 4)
-- Data: 2026-01-24
-- Executar no Supabase SQL Editor para validar todas as migrações

-- =============================================
-- 1. VALIDAR MIGRATION: consolidate_companies_organizations
-- =============================================
SELECT '=== Migration 1: Companies → Organizations ===' as validation;

-- Verificar novas colunas em organizations
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('cnpj', 'email', 'phone', 'address', 'city', 'state', 'size', 'status', 'plan_id', 'description', 'website', 'industry')
ORDER BY column_name;

-- Contar registros em organizations
SELECT COUNT(*) as total_organizations FROM organizations;

-- =============================================
-- 2. VALIDAR MIGRATION: lock_audit_logs_security
-- =============================================
SELECT '=== Migration 2: Audit Logs Security ===' as validation;

-- Verificar políticas RLS em audit_logs
SELECT 
  policyname, 
  permissive, 
  cmd
FROM pg_policies
WHERE tablename = 'audit_logs';

-- Verificar trigger prevent_audit_delete
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'audit_logs'
  AND trigger_name = 'prevent_audit_delete';

-- Contar audit logs
SELECT COUNT(*) as total_audit_logs FROM audit_logs;

-- =============================================
-- 3. VALIDAR MIGRATION: performance_indexes
-- =============================================
SELECT '=== Migration 3: Performance Indexes ===' as validation;

-- Verificar índices criados (apenas alguns principais)
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('jobs', 'applications', 'candidates', 'org_members', 'application_events')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Contar índices criados
SELECT COUNT(*) as total_performance_indexes
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
  AND schemaname = 'public';

-- =============================================
-- 4. VALIDAR MIGRATION: consolidate_iam
-- =============================================
SELECT '=== Migration 4: Consolidate IAM ===' as validation;

-- Verificar coluna status em org_members
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'org_members'
  AND column_name = 'status';

-- Verificar constraints em org_members
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'org_members'::regclass
  AND conname IN ('org_members_status_check', 'org_members_role_check');

-- Verificar se tabelas legadas foram removidas
SELECT 
  table_name
FROM information_schema.tables
WHERE table_name IN ('tenants', 'tenant_users')
  AND table_schema = 'public';

-- Contar membros por status e role
SELECT 
  status,
  role,
  COUNT(*) as count
FROM org_members
GROUP BY status, role
ORDER BY status, role;

-- Verificar scope em roles
SELECT DISTINCT scope FROM roles;

-- =============================================
-- 5. VALIDAR MIGRATION: business_metrics_views
-- =============================================
SELECT '=== Migration 5: Business Metrics Views ===' as validation;

-- Verificar se as 6 views foram criadas
SELECT 
  table_name as view_name
FROM information_schema.views
WHERE table_name IN (
  'v_recruitment_funnel',
  'v_avg_time_by_stage',
  'v_recruiter_performance',
  'v_top_candidates',
  'v_assessment_completion_rate',
  'v_executive_dashboard'
)
ORDER BY table_name;

-- Contar quantas views existem
SELECT COUNT(*) as views_created FROM information_schema.views
WHERE table_name IN (
  'v_recruitment_funnel',
  'v_avg_time_by_stage',
  'v_recruiter_performance',
  'v_top_candidates',
  'v_assessment_completion_rate',
  'v_executive_dashboard'
);

-- =============================================
-- 6. VALIDAR MIGRATION: organizations_metadata
-- =============================================
SELECT '=== Migration 6: Organizations Metadata ===' as validation;

-- Verificar novas colunas de metadados
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('description', 'website', 'industry')
ORDER BY column_name;

-- =============================================
-- RESUMO FINAL
-- =============================================
SELECT '=== RESUMO DA VALIDAÇÃO ===' as summary;

SELECT 
  'Organizations com metadados' as check_item,
  CASE 
    WHEN COUNT(*) >= 11 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('cnpj', 'email', 'phone', 'address', 'city', 'state', 'size', 'status', 'plan_id', 'description', 'website', 'industry');

SELECT 
  'Audit Logs protegido' as check_item,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'audit_logs';

SELECT 
  'Performance Indexes criados' as check_item,
  CASE 
    WHEN COUNT(*) >= 30 THEN '✅ PASS'
    ELSE '⚠️ PARTIAL'
  END as status,
  COUNT(*) as index_count
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
  AND schemaname = 'public';

SELECT 
  'IAM consolidado' as check_item,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name IN ('tenants', 'tenant_users')
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Tabelas legadas ainda existem'
  END as status;

SELECT 
  'org_members normalizado' as check_item,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*) || ' roles inválidos'
  END as status
FROM org_members
WHERE role NOT IN ('admin', 'manager', 'member', 'viewer');

SELECT 
  'Business Metrics Views criadas' as check_item,
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*) || '/6 views'
  END as status,
  COUNT(*) as view_count
FROM information_schema.views
WHERE table_name IN (
  'v_recruitment_funnel',
  'v_avg_time_by_stage',
  'v_recruiter_performance',
  'v_top_candidates',
  'v_assessment_completion_rate',
  'v_executive_dashboard'
);

SELECT '✅ Validação concluída! Verifique os resultados acima.' as final_message;
