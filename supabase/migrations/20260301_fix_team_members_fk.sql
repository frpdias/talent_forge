-- Fix team_members.user_id FK: auth.users → employees
-- O módulo PHP agrupa employees (que podem não ter conta Supabase).
-- O frontend já envia employee_id como user_id por compatibilidade.

-- 1. Remove FK atual para auth.users
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

-- 2. Adiciona FK para employees
ALTER TABLE team_members
  ADD CONSTRAINT team_members_employee_id_fkey
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE;

-- 3. Atualiza índice
DROP INDEX IF EXISTS idx_team_members_user_id;
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(user_id);

-- 4. Atualiza comentário
COMMENT ON COLUMN team_members.user_id IS 'ID do employee membro do time (mantido como user_id por compatibilidade de código)';
