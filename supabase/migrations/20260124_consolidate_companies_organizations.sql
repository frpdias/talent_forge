-- Consolidar companies em organizations
-- Arquivo: 20260124_consolidate_companies_organizations.sql
-- Data: 2026-01-24
-- Prioridade: P0

-- 1. Adicionar campos de companies em organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT CHECK (size IN ('small', 'medium', 'large', 'enterprise')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON organizations(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_size ON organizations(size) WHERE size IS NOT NULL;

-- 3. Migrar dados de companies para organizations (se houver)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    INSERT INTO organizations (name, description, website, industry, cnpj, email, phone, address, city, state, size)
    SELECT 
      c.name, 
      NULL, 
      c.website, 
      c.industry, 
      c.cnpj, 
      c.email, 
      c.phone, 
      c.address, 
      c.city, 
      c.state, 
      c.size
    FROM companies c
    WHERE NOT EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.cnpj = c.cnpj AND c.cnpj IS NOT NULL
    );
    
    -- Remover companies
    DROP TABLE companies CASCADE;
  END IF;
END $$;

-- 4. Comentários
COMMENT ON COLUMN organizations.cnpj IS 'CNPJ da organização (Brasil)';
COMMENT ON COLUMN organizations.email IS 'Email de contato da organização';
COMMENT ON COLUMN organizations.phone IS 'Telefone da organização';
COMMENT ON COLUMN organizations.address IS 'Endereço completo';
COMMENT ON COLUMN organizations.city IS 'Cidade';
COMMENT ON COLUMN organizations.state IS 'Estado/UF';
COMMENT ON COLUMN organizations.size IS 'Tamanho: small (1-50), medium (51-250), large (251-1000), enterprise (1000+)';
COMMENT ON COLUMN organizations.status IS 'Status: active, inactive, pending';
COMMENT ON COLUMN organizations.plan_id IS 'ID do plano contratado';
