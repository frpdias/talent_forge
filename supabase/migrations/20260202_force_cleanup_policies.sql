-- Limpeza FORÇADA de policies - Remove TUDO e recria do zero
-- Data: 2026-02-02
-- Prioridade: P0 - CRÍTICO
-- Razão: Limpeza anterior deixou 14 policies (deveria ter 3)

-- ============================================================================
-- DIAGNÓSTICO: Listar TODAS as policies de organizations
-- ============================================================================
SELECT policyname FROM pg_policies WHERE tablename = 'organizations';

-- ============================================================================
-- PASSO 1: FORÇAR remoção de TODAS as policies de organizations
-- ============================================================================

-- Remover usando WILDCARD (todas de uma vez)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'organizations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', pol.policyname);
    RAISE NOTICE 'Removida policy: %', pol.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- PASSO 2: Recriar APENAS as 3 policies necessárias
-- ============================================================================

-- Policy 1: SELECT (permite ver orgs onde é membro + JOINs)
CREATE POLICY organizations_select ON organizations
  FOR SELECT 
  USING (
    is_org_member(id)
    OR
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = organizations.id 
      AND om.user_id = auth.uid()
    )
  );

-- Policy 2: INSERT (criação aberta)
CREATE POLICY organizations_insert ON organizations
  FOR INSERT 
  WITH CHECK (true);

-- Policy 3: UPDATE (apenas membros)
CREATE POLICY organizations_update ON organizations
  FOR UPDATE 
  USING (is_org_member(id));

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  count_policies INT;
BEGIN
  SELECT COUNT(*) INTO count_policies
  FROM pg_policies 
  WHERE tablename = 'organizations';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Resultado da Limpeza Forçada';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organizations policies: %', count_policies;
  
  IF count_policies = 3 THEN
    RAISE NOTICE '✅ SUCESSO! Exatamente 3 policies criadas.';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: % policies encontradas (esperado: 3)', count_policies;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- QUERY DE VERIFICAÇÃO
-- ============================================================================
-- Execute após esta migration:
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'organizations' 
ORDER BY policyname;

-- Deve retornar APENAS 3 linhas:
-- organizations | organizations_insert | INSERT
-- organizations | organizations_select | SELECT
-- organizations | organizations_update | UPDATE
