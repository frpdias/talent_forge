-- =====================================================================
-- Fix: adicionar valor 'recruiter' ao enum org_type
-- A coluna já existia como ENUM com apenas 'company'.
-- 2026-03-10
-- =====================================================================

-- Adiciona valor 'recruiter' ao enum caso não exista
DO $$
BEGIN
  -- Tenta adicionar o valor ao enum; ignora se já existir
  ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'recruiter';
EXCEPTION
  -- Se org_type for TEXT com CHECK constraint (não ENUM), converte
  WHEN undefined_object THEN
    -- org_type é TEXT/CHECK — ajusta o CHECK constraint para incluir 'recruiter'
    -- (já coberto pela migration anterior, nada a fazer)
    NULL;
END;
$$;
