-- =====================================================
-- IAM Seed: Roles e Permissions básicos
-- Data: 2026-01-23
-- =====================================================

-- 1. Criar constraints UNIQUE (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_unique'
  ) THEN
    ALTER TABLE roles ADD CONSTRAINT roles_name_unique UNIQUE (name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'permissions_action_resource_unique'
  ) THEN
    ALTER TABLE permissions
      ADD CONSTRAINT permissions_action_resource_unique UNIQUE (action, resource);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_unique'
  ) THEN
    ALTER TABLE role_permissions
      ADD CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id);
  END IF;
END $$;

-- 2. Roles padrão do sistema
INSERT INTO roles (name, scope) VALUES
  ('owner', 'tenant'),
  ('admin', 'tenant'),
  ('recruiter', 'tenant'),
  ('viewer', 'tenant'),
  ('candidate', 'global')
ON CONFLICT (name) DO NOTHING;

-- 3. Permissions padrão (CRUD por recurso)
INSERT INTO permissions (action, resource) VALUES
  ('read', 'tenants'),
  ('update', 'tenants'),
  ('delete', 'tenants'),
  ('create', 'users'),
  ('read', 'users'),
  ('update', 'users'),
  ('delete', 'users'),
  ('create', 'jobs'),
  ('read', 'jobs'),
  ('update', 'jobs'),
  ('delete', 'jobs'),
  ('create', 'candidates'),
  ('read', 'candidates'),
  ('update', 'candidates'),
  ('delete', 'candidates'),
  ('create', 'applications'),
  ('read', 'applications'),
  ('update', 'applications'),
  ('delete', 'applications'),
  ('create', 'assessments'),
  ('read', 'assessments'),
  ('update', 'assessments'),
  ('read', 'reports'),
  ('read', 'settings'),
  ('update', 'settings'),
  ('read', 'audit_logs'),
  ('create', 'api_keys'),
  ('read', 'api_keys'),
  ('delete', 'api_keys')
ON CONFLICT (action, resource) DO NOTHING;

-- 4. Role-Permission mappings (owner tem tudo)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. Admin tem quase tudo (exceto delete tenant)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND NOT (p.action = 'delete' AND p.resource = 'tenants')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. Recruiter: CRUD jobs, candidates, applications, assessments, read reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'recruiter'
  AND (
    p.resource IN ('jobs', 'candidates', 'applications', 'assessments')
    OR (p.action = 'read' AND p.resource IN ('reports', 'users'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 7. Viewer: apenas leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
  AND p.resource IN ('jobs', 'candidates', 'applications', 'assessments', 'reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;
