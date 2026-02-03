-- ============================================================================
-- Migration: Adicionar RLS Policies para employees
-- Data: 2026-02-02
-- Prioridade: P0 - CRÍTICO (bloqueando funcionalidade TFCI)
-- ============================================================================

-- PROBLEMA: Tabela employees tem RLS ativo mas SEM policies
-- SINTOMA: 403 Forbidden ao tentar buscar funcionários
-- SOLUÇÃO: Criar policies básicas para permitir acesso via org_members

-- ============================================================================
-- PASSO 1: Verificar status atual do RLS
-- ============================================================================
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INT;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'employees' AND relnamespace = 'public'::regnamespace;
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'employees';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Status RLS da tabela employees';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS ativado: %', rls_enabled;
  RAISE NOTICE 'Policies existentes: %', policy_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PASSO 2: Criar function helper para verificar acesso a employees
-- ============================================================================

-- Função: Verifica se o usuário é membro da organização do employee
CREATE OR REPLACE FUNCTION is_employee_org_member(p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_organization_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASSO 3: Criar policies RLS para employees
-- ============================================================================

-- Policy 1: SELECT - permite ver employees da organização onde é membro
DROP POLICY IF EXISTS employees_select_org_members ON employees;
CREATE POLICY employees_select_org_members ON employees
  FOR SELECT
  USING (
    is_employee_org_member(organization_id)
  );

-- Policy 2: INSERT - apenas membros da org podem adicionar employees
DROP POLICY IF EXISTS employees_insert_org_members ON employees;
CREATE POLICY employees_insert_org_members ON employees
  FOR INSERT
  WITH CHECK (
    is_employee_org_member(organization_id)
  );

-- Policy 3: UPDATE - apenas membros da org podem editar employees
DROP POLICY IF EXISTS employees_update_org_members ON employees;
CREATE POLICY employees_update_org_members ON employees
  FOR UPDATE
  USING (
    is_employee_org_member(organization_id)
  );

-- Policy 4: DELETE - apenas membros da org podem deletar employees
DROP POLICY IF EXISTS employees_delete_org_members ON employees;
CREATE POLICY employees_delete_org_members ON employees
  FOR DELETE
  USING (
    is_employee_org_member(organization_id)
  );

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'employees';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Resultado: Policies RLS criadas';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de policies: %', policy_count;
  
  IF policy_count = 4 THEN
    RAISE NOTICE '✅ SUCESSO! 4 policies criadas (SELECT, INSERT, UPDATE, DELETE)';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: % policies encontradas (esperado: 4)', policy_count;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- QUERY DE VERIFICAÇÃO
-- ============================================================================
-- Execute após esta migration:
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Permite ver employees da org'
    WHEN cmd = 'INSERT' THEN 'Permite adicionar employees'
    WHEN cmd = 'UPDATE' THEN 'Permite editar employees'
    WHEN cmd = 'DELETE' THEN 'Permite deletar employees'
  END as descricao
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY cmd;

-- Deve retornar 4 linhas com as policies criadas
