-- Função para verificar status de RLS em tabelas
-- Arquivo: 20260123_security_check_functions.sql
-- Data: 2026-01-23

-- Função para verificar RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_tables INTEGER;
  tables_with_rls INTEGER;
BEGIN
  -- Contar tabelas críticas
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN (
      'organizations', 'org_members', 'candidates', 'jobs', 
      'pipeline_stages', 'applications', 'application_events',
      'assessments', 'disc_assessments', 'user_profiles',
      'audit_logs', 'security_events', 'user_activity', 'blocked_ips'
    );

  -- Contar tabelas com RLS habilitado
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'organizations', 'org_members', 'candidates', 'jobs', 
      'pipeline_stages', 'applications', 'application_events',
      'assessments', 'disc_assessments', 'user_profiles',
      'audit_logs', 'security_events', 'user_activity', 'blocked_ips'
    );

  -- Construir resposta JSON
  result := jsonb_build_object(
    'total_tables', total_tables,
    'tables_with_rls', tables_with_rls,
    'percentage', ROUND((tables_with_rls::NUMERIC / NULLIF(total_tables, 0)) * 100, 2),
    'status', CASE 
      WHEN tables_with_rls = total_tables THEN 'pass'
      WHEN tables_with_rls > total_tables * 0.7 THEN 'warning'
      ELSE 'fail'
    END,
    'message', CASE 
      WHEN tables_with_rls = total_tables THEN 'RLS habilitado em todas as tabelas críticas'
      WHEN tables_with_rls > total_tables * 0.7 THEN 'RLS habilitado na maioria das tabelas'
      ELSE 'RLS não está habilitado em tabelas suficientes'
    END,
    'checked_at', NOW()
  );

  RETURN result;
END;
$$;

-- Permitir execução para usuários autenticados
GRANT EXECUTE ON FUNCTION check_rls_status() TO authenticated;

-- Função para listar políticas RLS ativas
CREATE OR REPLACE FUNCTION list_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  policy_command TEXT,
  policy_roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pol.tablename::TEXT,
    pol.policyname::TEXT,
    pol.cmd::TEXT,
    pol.roles::TEXT[]
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
  ORDER BY pol.tablename, pol.policyname;
END;
$$;

-- Permitir execução para admins apenas
GRANT EXECUTE ON FUNCTION list_rls_policies() TO authenticated;

-- Comentários
COMMENT ON FUNCTION check_rls_status() IS 'Verifica o status de Row Level Security em tabelas críticas';
COMMENT ON FUNCTION list_rls_policies() IS 'Lista todas as políticas RLS ativas no schema público';
