-- Cleanup: Remover tabelas e tipos não utilizados
-- Data: 13/12/2025
-- Descrição: Remove tabelas criadas por erro que conflitam com a aplicação

-- Desabilitar RLS temporariamente para permitir drop
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_applications_view DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_saved_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS application_events DISABLE ROW LEVEL SECURITY;

-- Drop das tabelas em ordem de dependência
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS candidate_applications_view CASCADE;
DROP TABLE IF EXISTS candidate_saved_jobs CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS application_events CASCADE;

-- Remove colunas adicionadas às tabelas existentes que não usamos
ALTER TABLE IF EXISTS candidates DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE IF EXISTS jobs DROP COLUMN IF EXISTS is_public CASCADE;
ALTER TABLE IF EXISTS jobs DROP COLUMN IF EXISTS external_apply_url CASCADE;

-- Remove indices órfãos se existirem
DROP INDEX IF EXISTS candidates_user_idx CASCADE;
DROP INDEX IF EXISTS candidate_saved_jobs_user_idx CASCADE;
DROP INDEX IF EXISTS jobs_public_idx CASCADE;
DROP INDEX IF EXISTS invitations_token_idx CASCADE;
DROP INDEX IF EXISTS invitations_email_idx CASCADE;

-- Remove o enum não utilizado
DROP TYPE IF EXISTS assessment_kind CASCADE;

-- Verifica se há mais colunas desnecessárias em org_members
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
ALTER TABLE org_members ADD CONSTRAINT org_members_role_check 
  CHECK (role IN ('admin', 'manager', 'member', 'viewer'));

-- Confirma que limpeza foi feita
SELECT 'Limpeza concluída com sucesso!' as status;
