-- IAM Core (Tenants/Roles/Policies)
-- Date: 2026-01-22
-- Updated: 2026-02-03
--
-- ⚠️ NOTA IMPORTANTE:
-- As tabelas `tenants` e `tenant_users` abaixo foram DESCONTINUADAS.
-- A aplicação usa `organizations` e `org_members` para multi-tenant.
-- Estas CREATE TABLE são mantidas comentadas apenas para referência histórica.
-- NÃO DESCOMENTE - as tabelas corretas já existem (organizations, org_members).

-- DEPRECATED: Tenants (usar organizations)
-- CREATE TABLE IF NOT EXISTS tenants (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   status TEXT NOT NULL DEFAULT 'active',
--   plan_id TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- DEPRECATED: Tenant users (usar org_members)
-- CREATE TABLE IF NOT EXISTS tenant_users (
--   tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   role TEXT NOT NULL DEFAULT 'member',
--   status TEXT NOT NULL DEFAULT 'active',
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (tenant_id, user_id)
-- );

-- Roles and permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (action, resource)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Policies (ABAC)
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effect TEXT NOT NULL DEFAULT 'allow',
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security events
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policies (minimal)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_users' AND policyname = 'tenant_users_select_self'
  ) THEN
    CREATE POLICY tenant_users_select_self ON tenant_users
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'tenants_select_member'
  ) THEN
    CREATE POLICY tenants_select_member ON tenants
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM tenant_users tu
          WHERE tu.tenant_id = tenants.id AND tu.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_tenants_updated_at' AND c.relname = 'tenants'
  ) THEN
    CREATE TRIGGER update_tenants_updated_at
      BEFORE UPDATE ON tenants
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_roles_updated_at' AND c.relname = 'roles'
  ) THEN
    CREATE TRIGGER update_roles_updated_at
      BEFORE UPDATE ON roles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_permissions_updated_at' AND c.relname = 'permissions'
  ) THEN
    CREATE TRIGGER update_permissions_updated_at
      BEFORE UPDATE ON permissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_policies_updated_at' AND c.relname = 'policies'
  ) THEN
    CREATE TRIGGER update_policies_updated_at
      BEFORE UPDATE ON policies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
