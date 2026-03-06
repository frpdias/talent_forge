-- Reativação de RLS em Organizations
-- Arquivo: 20260129_reactivate_organizations_rls.sql
-- Data: 2026-01-29
-- Prioridade: P0 - CRÍTICO
-- Referência: TODO na Arquitetura Canônica (Sprint 5)

-- =============================================
-- CONTEXTO
-- =============================================
-- RLS foi desabilitado em 2026-01-24 devido a políticas muito restritivas
-- que bloqueavam acesso legítimo de admins.
-- Esta migration reativa RLS com políticas corrigidas.

-- =============================================
-- 1. LIMPAR POLÍTICAS ANTIGAS (se existirem)
-- =============================================

DROP POLICY IF EXISTS "admin_full_access_organizations" ON organizations;
DROP POLICY IF EXISTS "member_read_own_organizations" ON organizations;
DROP POLICY IF EXISTS "system_create_organizations" ON organizations;

-- =============================================
-- 2. REATIVAR RLS
-- =============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. POLÍTICA: Admins têm acesso total
-- =============================================
-- Admins podem ver, criar, atualizar e deletar TODAS as organizations
-- Identificação via raw_user_meta_data->>'user_type' = 'admin'

CREATE POLICY "admin_full_access_organizations"
ON organizations
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
);

-- =============================================
-- 4. POLÍTICA: Membros veem apenas suas organizations
-- =============================================
-- Usuários veem apenas organizations onde são membros ativos
-- Via tabela org_members

CREATE POLICY "member_read_own_organizations"
ON organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM org_members 
    WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.status = 'active'
  )
);

-- =============================================
-- 5. POLÍTICA: Criação de organizations (restrita)
-- =============================================
-- Apenas admins podem criar organizations via UI
-- Service role pode criar via backend (bypass RLS)

CREATE POLICY "admin_create_organizations"
ON organizations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
);

-- =============================================
-- 6. POLÍTICA: Atualização de organizations
-- =============================================
-- Admins podem atualizar qualquer organization
-- Admins da organization (role='admin' em org_members) podem atualizar

CREATE POLICY "admin_update_organizations"
ON organizations
FOR UPDATE
USING (
  -- Global admins
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
  OR
  -- Organization admins
  EXISTS (
    SELECT 1 
    FROM org_members 
    WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'admin'
      AND org_members.status = 'active'
  )
);

-- =============================================
-- 7. POLÍTICA: Deleção de organizations (restrita)
-- =============================================
-- Apenas global admins podem deletar organizations
-- Proteção adicional contra exclusões acidentais

CREATE POLICY "admin_delete_organizations"
ON organizations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
);

-- =============================================
-- 8. VALIDAÇÃO
-- =============================================

-- Verificar que RLS está ativo
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'organizations' 
      AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS não foi ativado em organizations!';
  END IF;
END $$;

-- Contar policies criadas (deve ser 5)
DO $$ 
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'organizations'
    AND schemaname = 'public';
  
  IF policy_count < 5 THEN
    RAISE WARNING 'Apenas % policies criadas, esperado 5', policy_count;
  END IF;
  
  RAISE NOTICE '✅ RLS em organizations reativado com % policies', policy_count;
END $$;

-- =============================================
-- 9. COMENTÁRIOS (Documentação)
-- =============================================

COMMENT ON POLICY "admin_full_access_organizations" ON organizations IS 
'Global admins (user_type=admin) têm acesso total a todas organizations';

COMMENT ON POLICY "member_read_own_organizations" ON organizations IS 
'Membros ativos veem apenas organizations onde pertencem (via org_members)';

COMMENT ON POLICY "admin_create_organizations" ON organizations IS 
'Apenas global admins podem criar organizations via interface';

COMMENT ON POLICY "admin_update_organizations" ON organizations IS 
'Global admins e organization admins podem atualizar';

COMMENT ON POLICY "admin_delete_organizations" ON organizations IS 
'Apenas global admins podem deletar organizations (proteção adicional)';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
-- Próximo passo: Executar VALIDATE_IMPROVEMENTS.sql
-- para verificar que tudo está funcionando corretamente
