-- Consolidar IAM (tenants → organizations)
-- Arquivo: 20260124_consolidate_iam.sql
-- Data: 2026-01-24
-- Prioridade: P1

-- 1. Preparar org_members (adicionar coluna status e remover constraints)
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_status_check;
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;

-- 2. Normalizar TODOS os dados existentes ANTES de qualquer migração
UPDATE org_members 
SET status = 'active' 
WHERE status IS NULL 
   OR status NOT IN ('active', 'inactive', 'invited', 'suspended');

UPDATE org_members 
SET role = CASE 
  WHEN role IN ('admin', 'manager', 'member', 'viewer') THEN role
  WHEN role = 'owner' THEN 'admin'  -- owner → admin
  ELSE 'member'
END
WHERE role IS NULL 
   OR role NOT IN ('admin', 'manager', 'member', 'viewer');

-- 3. PRIMEIRO: Garantir que todos tenants existam em organizations
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    -- Inserir tenants que não existem em organizations
    INSERT INTO organizations (id, name, org_type, status, plan_id, created_at)
    SELECT 
      t.id,
      COALESCE(t.name, 'Organização ' || t.id),
      'company',  -- tipo padrão
      COALESCE(t.status, 'active'),
      t.plan_id,
      COALESCE(t.created_at, NOW())
    FROM tenants t
    WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = t.id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Atualizar organizations existentes com dados de tenants
    UPDATE organizations o
    SET 
      status = COALESCE(o.status, t.status),
      plan_id = COALESCE(o.plan_id, t.plan_id)
    FROM tenants t
    WHERE o.id = t.id;
  END IF;
END $$;

-- 4. DEPOIS: Migrar tenant_users para org_members (agora org_ids existem)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users') THEN
    -- Migrar apenas tenant_users cujos tenant_id existem em organizations
    INSERT INTO org_members (org_id, user_id, role, status)
    SELECT 
      tu.tenant_id, 
      tu.user_id, 
      CASE 
        WHEN tu.role IN ('admin', 'manager', 'member', 'viewer') THEN tu.role
        WHEN tu.role = 'owner' THEN 'admin'
        ELSE 'member'
      END as role,
      CASE 
        WHEN tu.status IN ('active', 'inactive', 'invited', 'suspended') THEN tu.status
        ELSE 'active'
      END as status
    FROM tenant_users tu
    INNER JOIN organizations o ON o.id = tu.tenant_id  -- Garantir FK válida
    ON CONFLICT (org_id, user_id) DO UPDATE 
    SET role = EXCLUDED.role, status = EXCLUDED.status;
  END IF;
END $$;

-- 5. Remover tabelas antigas
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users') THEN
    DROP TABLE tenant_users CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    DROP TABLE tenants CASCADE;
  END IF;
END $$;

-- 6. Atualizar scope de roles
UPDATE roles SET scope = 'organization' WHERE scope = 'tenant';

-- 7. Adicionar constraints em org_members
ALTER TABLE org_members ADD CONSTRAINT org_members_status_check 
  CHECK (status IN ('active', 'inactive', 'invited', 'suspended'));

ALTER TABLE org_members ADD CONSTRAINT org_members_role_check 
  CHECK (role IN ('admin', 'manager', 'member', 'viewer'));

-- 8. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_org_members_status 
  ON org_members(org_id, status) 
  WHERE status = 'active';

-- 9. Atualizar comentários
COMMENT ON TABLE org_members IS 'Membros das organizações (multi-tenant)';
COMMENT ON COLUMN org_members.status IS 'Status: active, inactive, invited, suspended';
COMMENT ON COLUMN roles.scope IS 'Escopo: organization, system';

