-- Consolidar IAM (tenants → organizations)
-- Arquivo: 20260124_consolidate_iam.sql
-- Data: 2026-01-24
-- Prioridade: P1

-- 1. Migrar tenant_users para org_members
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users') THEN
    -- Garantir que org_members tem coluna status
    ALTER TABLE org_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    
    -- Remover constraint se existir (para permitir migração)
    ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_status_check;
    
    -- Migrar dados com normalização de status
    INSERT INTO org_members (org_id, user_id, role, status)
    SELECT 
      tenant_id, 
      user_id, 
      role, 
      CASE 
        WHEN status IN ('active', 'inactive', 'invited', 'suspended') THEN status
        ELSE 'active'
      END as status
    FROM tenant_users
    ON CONFLICT (org_id, user_id) DO UPDATE 
    SET role = EXCLUDED.role, status = EXCLUDED.status;
    
    -- Remover tenant_users
    DROP TABLE tenant_users CASCADE;
  END IF;
END $$;

-- 2. Remover tabela tenants redundante
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    -- Migrar dados importantes para organizations se necessário
    UPDATE organizations o
    SET 
      status = COALESCE(o.status, t.status),
      plan_id = COALESCE(o.plan_id, t.plan_id)
    FROM tenants t
    WHERE o.id = t.id;
    
    -- Remover tenants
    DROP TABLE tenants CASCADE;
  END IF;
END $$;

-- 3. Atualizar scope de roles
UPDATE roles SET scope = 'organization' WHERE scope = 'tenant';

-- 4. Normalizar TODOS os status existentes em org_members
UPDATE org_members 
SET status = 'active' 
WHERE status IS NULL 
   OR status NOT IN ('active', 'inactive', 'invited', 'suspended');

-- 5. Adicionar constraint em org_members
ALTER TABLE org_members 
  DROP CONSTRAINT IF EXISTS org_members_status_check;
  
ALTER TABLE org_members 
  ADD CONSTRAINT org_members_status_check 
  CHECK (status IN ('active', 'inactive', 'invited', 'suspended'));

-- 6. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_org_members_status 
  ON org_members(org_id, status) 
  WHERE status = 'active';

-- 7. Atualizar comentários
COMMENT ON TABLE org_members IS 'Membros das organizações (multi-tenant)';
COMMENT ON COLUMN org_members.status IS 'Status: active, inactive, invited, suspended';
COMMENT ON COLUMN roles.scope IS 'Escopo: organization, system';
