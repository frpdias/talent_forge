-- Migration: Adiciona campos corporativos à tabela organizations
-- Data: 2026-02-04
-- Descrição: Campos para informações completas da empresa (CNPJ, contato, endereço, etc.)

-- ========================================
-- 1. ADICIONAR CAMPOS CORPORATIVOS
-- ========================================

-- Identificação
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS size TEXT CHECK (size IN ('micro', 'small', 'medium', 'large', 'enterprise'));

-- Contato
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;

-- Localização
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';

-- Metadata adicional
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;

-- ========================================
-- 2. ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON organizations(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry) WHERE industry IS NOT NULL;

-- ========================================
-- 3. COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN organizations.cnpj IS 'CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)';
COMMENT ON COLUMN organizations.industry IS 'Setor/indústria da empresa';
COMMENT ON COLUMN organizations.size IS 'Porte da empresa: micro, small, medium, large, enterprise';
COMMENT ON COLUMN organizations.email IS 'Email de contato principal da empresa';
COMMENT ON COLUMN organizations.phone IS 'Telefone de contato principal';
COMMENT ON COLUMN organizations.website IS 'Website oficial da empresa';
COMMENT ON COLUMN organizations.address IS 'Endereço completo';
COMMENT ON COLUMN organizations.city IS 'Cidade';
COMMENT ON COLUMN organizations.state IS 'Estado (UF)';
COMMENT ON COLUMN organizations.zip_code IS 'CEP';
COMMENT ON COLUMN organizations.country IS 'País';
COMMENT ON COLUMN organizations.logo_url IS 'URL do logo da empresa';
COMMENT ON COLUMN organizations.description IS 'Descrição/sobre a empresa';
