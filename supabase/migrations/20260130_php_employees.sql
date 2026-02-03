-- Migration: PHP Module - Employees System
-- Data: 2026-01-30
-- Descrição: Adiciona tabela employees e parent_org_id para separar conceitos de Account/Tenant vs Organization

-- ========================================
-- 1. ADICIONAR PARENT_ORG_ID EM ORGANIZATIONS
-- ========================================
-- Permite hierarquia: headhunter (account) -> company (client)
-- parent_org_id = NULL → account raiz (headhunter/consultoria)
-- parent_org_id = uuid → company pertence a esse account

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orgs_parent ON organizations(parent_org_id);

COMMENT ON COLUMN organizations.parent_org_id IS 'ID da organização pai (headhunter/account). NULL se for account raiz, UUID se for empresa cliente.';

-- ========================================
-- 2. CRIAR TABELA EMPLOYEES
-- ========================================
-- Funcionários das empresas clientes (usado no PHP Module)
-- NÃO confundir com candidates (que são do processo de recrutamento)

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL, -- TODO: encriptar com pg_crypto em Sprint futura
  birth_date DATE,
  hire_date DATE NOT NULL,
  termination_date DATE,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  position TEXT,
  department TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_cpf_per_org UNIQUE (organization_id, cpf)
);

-- ========================================
-- 3. ÍNDICES PARA EMPLOYEES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department) WHERE department IS NOT NULL;

-- ========================================
-- 4. RLS POLICIES PARA EMPLOYEES
-- ========================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 4.1 Admin full access (ler/criar/atualizar/deletar)
CREATE POLICY "admin_full_access_employees"
ON employees
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
);

-- 4.2 Membros da organização podem ler employees da sua org
CREATE POLICY "member_read_own_employees"
ON employees
FOR SELECT
USING (
  is_org_member(organization_id)
);

-- 4.3 Membros da organização podem criar employees
CREATE POLICY "member_create_employees"
ON employees
FOR INSERT
WITH CHECK (
  is_org_member(organization_id)
);

-- 4.4 Membros da organização podem atualizar employees
CREATE POLICY "member_update_employees"
ON employees
FOR UPDATE
USING (
  is_org_member(organization_id)
);

-- 4.5 Apenas admins podem deletar employees
-- (Evita exclusão acidental, prefere-se status='terminated')
CREATE POLICY "admin_delete_employees"
ON employees
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
);

-- ========================================
-- 5. TRIGGER UPDATED_AT
-- ========================================

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. COMENTÁRIOS (DOCUMENTAÇÃO)
-- ========================================

COMMENT ON TABLE employees IS 'Funcionários das empresas clientes. Usado no PHP Module (TFCI, NR-1, COPC). Não confundir com candidates (recrutamento ATS).';
COMMENT ON COLUMN employees.organization_id IS 'Empresa à qual o funcionário pertence. Deve ser uma organization com org_type=company.';
COMMENT ON COLUMN employees.cpf IS 'CPF do funcionário. Único por organização. TODO: encriptar em Sprint futura.';
COMMENT ON COLUMN employees.manager_id IS 'ID do gestor imediato. Permite construir hierarquia/organograma.';
COMMENT ON COLUMN employees.user_id IS 'ID do usuário no auth.users. NULL se o funcionário não tem login no sistema. Se preenchido, permite login e acesso aos próprios resultados.';
COMMENT ON COLUMN employees.status IS 'Status atual: active (ativo), inactive (afastado), terminated (desligado).';
COMMENT ON COLUMN employees.metadata IS 'Dados adicionais (endereço, contatos, observações). JSON flexível.';

-- ========================================
-- 7. VALIDAÇÃO (SANITY CHECK)
-- ========================================

-- Verificar que a tabela foi criada corretamente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    RAISE EXCEPTION 'Tabela employees não foi criada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'parent_org_id') THEN
    RAISE EXCEPTION 'Coluna parent_org_id não foi adicionada em organizations';
  END IF;

  RAISE NOTICE '✅ Migration 20260130_php_employees aplicada com sucesso';
END $$;
