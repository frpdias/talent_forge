-- Migration: Adicionar email e phone à tabela employees
-- Data: 2026-01-30
-- Descrição: Adiciona colunas email e phone para contato direto dos funcionários

-- ========================================
-- ADICIONAR COLUNAS EMAIL E PHONE
-- ========================================

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN employees.email IS 'Email do funcionário para contato';
COMMENT ON COLUMN employees.phone IS 'Telefone do funcionário para contato';

-- ========================================
-- ÍNDICES OPCIONAIS (para busca por email/phone)
-- ========================================

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone) WHERE phone IS NOT NULL;
