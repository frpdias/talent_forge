-- Limpeza de policies duplicadas em organizations
-- Data: 2026-02-02
-- Prioridade: P0 - CRÍTICO
-- Razão: Migration anterior deixou 17 policies ativas (deveria ter apenas 3)

-- ============================================================================
-- DIAGNÓSTICO ATUAL
-- ============================================================================
-- org_members: 4 policies ✅ (correto)
-- organizations: 17 policies ❌ (deveria ter 3)
--
-- Policies duplicadas encontradas:
-- - Admins can delete organizations (antiga)
-- - Admins can insert organizations (antiga)
-- - Admins can update organizations (antiga)
-- - Admins can view all organizations (antiga)
-- - Members can view their organizations (antiga)
-- - admin_create_organizations (20260129)
-- - admin_delete_organizations (20260129)
-- - admin_full_access_organizations (20260129)
-- - admin_update_organizations (20260129)
-- - member_read_own_organizations (20260129)
-- - organizations_insert (20260202 - MANTER)
-- - organizations_select (20260202 - MANTER)
-- - organizations_update (20260202 - MANTER)

-- ============================================================================
-- PASSO 1: Remover TODAS as policies antigas de organizations
-- ============================================================================

-- Policies antigas (antes de 20260129)
DROP POLICY IF EXISTS "Admins can delete organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;

-- Policies de 20260129_reactivate_organizations_rls.sql (substituídas)
DROP POLICY IF EXISTS admin_create_organizations ON organizations;
DROP POLICY IF EXISTS admin_delete_organizations ON organizations;
DROP POLICY IF EXISTS admin_full_access_organizations ON organizations;
DROP POLICY IF EXISTS admin_update_organizations ON organizations;
DROP POLICY IF EXISTS member_read_own_organizations ON organizations;

-- Policies com prefixo errado (se existirem)
DROP POLICY IF EXISTS orgs_select ON organizations;
DROP POLICY IF EXISTS orgs_insert ON organizations;
DROP POLICY IF EXISTS orgs_update ON organizations;
DROP POLICY IF EXISTS orgs_delete ON organizations;

-- ============================================================================
-- PASSO 2: Garantir que as 3 policies corretas existem
-- ============================================================================

-- Policy 1: SELECT (permite ver orgs onde é membro)
DROP POLICY IF EXISTS organizations_select ON organizations;
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
DROP POLICY IF EXISTS organizations_insert ON organizations;
CREATE POLICY organizations_insert ON organizations
  FOR INSERT 
  WITH CHECK (true);

-- Policy 3: UPDATE (apenas membros)
DROP POLICY IF EXISTS organizations_update ON organizations;
CREATE POLICY organizations_update ON organizations
  FOR UPDATE 
  USING (is_org_member(id));

-- ============================================================================
-- PASSO 3: Verificação automática
-- ============================================================================

DO $$
DECLARE
  org_members_policies INT;
  organizations_policies INT;
BEGIN
  -- Contar policies
  SELECT COUNT(*) INTO org_members_policies
  FROM pg_policies WHERE tablename = 'org_members';
  
  SELECT COUNT(*) INTO organizations_policies
  FROM pg_policies WHERE tablename = 'organizations';
  
  -- Mostrar resultado
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verificação de Policies RLS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'org_members: % policies', org_members_policies;
  RAISE NOTICE 'organizations: % policies', organizations_policies;
  RAISE NOTICE '';
  
  -- Validar
  IF org_members_policies = 4 AND organizations_policies = 3 THEN
    RAISE NOTICE '✅ SUCESSO: Número correto de policies!';
    RAISE NOTICE '   - org_members: 4 (select, insert, update, delete)';
    RAISE NOTICE '   - organizations: 3 (select, insert, update)';
  ELSE
    RAISE WARNING '⚠️  ATENÇÃO: Número incorreto de policies!';
    IF org_members_policies != 4 THEN
      RAISE WARNING '   - org_members tem %, esperado 4', org_members_policies;
    END IF;
    IF organizations_policies != 3 THEN
      RAISE WARNING '   - organizations tem %, esperado 3', organizations_policies;
    END IF;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- QUERY DE VERIFICAÇÃO FINAL
-- ============================================================================
-- Execute após aplicar esta migration:
--
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('org_members', 'organizations') 
-- ORDER BY tablename, policyname;
--
-- Resultado esperado:
-- org_members     | org_members_delete  | DELETE
-- org_members     | org_members_insert  | INSERT
-- org_members     | org_members_select  | SELECT
-- org_members     | org_members_update  | UPDATE
-- organizations   | organizations_insert| INSERT
-- organizations   | organizations_select| SELECT
-- organizations   | organizations_update| UPDATE
