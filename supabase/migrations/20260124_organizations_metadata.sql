-- Add metadata fields to organizations
-- Arquivo: 20260124_organizations_metadata.sql
-- Data: 2026-01-24

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT;

COMMENT ON COLUMN organizations.description IS 'Descricao da organizacao';
COMMENT ON COLUMN organizations.website IS 'Website da organizacao';
COMMENT ON COLUMN organizations.industry IS 'Setor da organizacao';
