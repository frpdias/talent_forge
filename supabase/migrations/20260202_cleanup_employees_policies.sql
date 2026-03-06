-- ============================================================================
-- Migration: Limpar policies duplicadas da tabela employees
-- Data: 2026-02-02
-- Prioridade: P0 - CRÍTICO
-- Razão: 9 policies duplicadas (deveria ter 4)
-- ============================================================================

-- PROBLEMA: Existem policies antigas (admin_*, member_*) + novas (employees_*)
-- SOLUÇÃO: Remover todas e manter apenas as 4 corretas

-- ============================================================================
-- PASSO 1: Diagnóstico - Listar TODAS as policies atuais
-- ============================================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policies ANTES da limpeza:';
  RAISE NOTICE '========================================';
  
  FOR pol IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'employees'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  % - %', pol.cmd, pol.policyname;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PASSO 2: FORÇAR remoção de TODAS as policies antigas (lixo)
-- ============================================================================

-- Remover policies antigas (prefixo admin_* e member_*)
DROP POLICY IF EXISTS admin_full_access_employees ON employees;
DROP POLICY IF EXISTS admin_delete_employees ON employees;
DROP POLICY IF EXISTS member_create_employees ON employees;
DROP POLICY IF EXISTS member_read_own_employees ON employees;
DROP POLICY IF EXISTS member_update_employees ON employees;

-- ============================================================================
-- PASSO 3: Garantir que as 4 policies corretas existem
-- ============================================================================

-- Policy 1: SELECT
DROP POLICY IF EXISTS employees_select_org_members ON employees;
CREATE POLICY employees_select_org_members ON employees
  FOR SELECT
  USING (is_employee_org_member(organization_id));

-- Policy 2: INSERT
DROP POLICY IF EXISTS employees_insert_org_members ON employees;
CREATE POLICY employees_insert_org_members ON employees
  FOR INSERT
  WITH CHECK (is_employee_org_member(organization_id));

-- Policy 3: UPDATE
DROP POLICY IF EXISTS employees_update_org_members ON employees;
CREATE POLICY employees_update_org_members ON employees
  FOR UPDATE
  USING (is_employee_org_member(organization_id));

-- Policy 4: DELETE
DROP POLICY IF EXISTS employees_delete_org_members ON employees;
CREATE POLICY employees_delete_org_members ON employees
  FOR DELETE
  USING (is_employee_org_member(organization_id));

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  policy_count INT;
  pol RECORD;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'employees';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Resultado da Limpeza de Policies';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de policies: %', policy_count;
  
  IF policy_count = 4 THEN
    RAISE NOTICE '✅ SUCESSO! Exatamente 4 policies (correto)';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: % policies encontradas (esperado: 4)', policy_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Policies APÓS limpeza:';
  RAISE NOTICE '----------------------------------------';
  
  FOR pol IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'employees'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE '  % | %', pol.cmd, pol.policyname;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- QUERY DE VERIFICAÇÃO FINAL
-- ============================================================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Permite ver employees da org'
    WHEN cmd = 'INSERT' THEN '✅ Permite adicionar employees'
    WHEN cmd = 'UPDATE' THEN '✅ Permite editar employees'
    WHEN cmd = 'DELETE' THEN '✅ Permite deletar employees'
  END as status
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY cmd;

-- Deve retornar APENAS 4 linhas:
-- employees_delete_org_members | DELETE | ✅ Permite deletar employees
-- employees_insert_org_members | INSERT | ✅ Permite adicionar employees
-- employees_select_org_members | SELECT | ✅ Permite ver employees da org
-- employees_update_org_members | UPDATE | ✅ Permite editar employees
