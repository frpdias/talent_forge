-- =============================================================
-- Migration: Adicionar employee_id a team_members
-- 
-- Contexto: O módulo PHP precisa vincular funcionários (employees)
-- a times, mesmo quando o funcionário não tem conta de acesso 
-- (auth.users). Antes, team_members só aceitava user_id (NOT NULL, 
-- FK auth.users), impedindo a inclusão da maioria dos funcionários.
--
-- Mudanças:
-- 1. Adiciona coluna employee_id (FK employees.id)
-- 2. Torna user_id nullable (permite membros sem conta de acesso)
-- 3. Adiciona CHECK: pelo menos employee_id OU user_id preenchido
-- 4. Adiciona UNIQUE(team_id, employee_id) para evitar duplicatas
-- 5. RLS mantida conforme policies existentes
-- =============================================================

-- 1. Adicionar coluna employee_id
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;

-- 2. Tornar user_id nullable
ALTER TABLE team_members 
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. CHECK: pelo menos um dos dois deve ser preenchido
ALTER TABLE team_members 
  ADD CONSTRAINT team_members_has_user_or_employee 
  CHECK (user_id IS NOT NULL OR employee_id IS NOT NULL);

-- 4. Unique por employee dentro do time (quando employee_id preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_team_employee 
  ON team_members(team_id, employee_id) 
  WHERE employee_id IS NOT NULL;

-- 5. Index para buscas por employee_id
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id 
  ON team_members(employee_id) 
  WHERE employee_id IS NOT NULL;

-- 6. Preencher employee_id nos registros existentes (que têm user_id vinculado a um employee)
UPDATE team_members tm
SET employee_id = e.id
FROM employees e
WHERE tm.user_id = e.user_id
  AND tm.employee_id IS NULL;

COMMENT ON COLUMN team_members.employee_id IS 'FK para employees.id — permite vincular funcionários sem conta de acesso ao time';
