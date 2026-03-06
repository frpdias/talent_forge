-- Sprint 23: NR-1 Campaign Support
-- Transforma nr1_risk_assessments em campanhas com agregação de respostas dos colaboradores
-- Em vez de RH preencher riscos manualmente, agora:
-- 1. RH cria campanha (nr1_risk_assessments com is_campaign=true)
-- 2. Colaboradores recebem convites e respondem (nr1_self_assessments)
-- 3. Sistema agrega respostas e calcula risco real por dimensão

-- Novos campos na tabela existente
ALTER TABLE nr1_risk_assessments
  ADD COLUMN IF NOT EXISTS campaign_name TEXT,
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'organization' CHECK (scope IN ('organization', 'team', 'department')),
  ADD COLUMN IF NOT EXISTS scope_target TEXT,
  ADD COLUMN IF NOT EXISTS total_invited INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_responded INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_campaign BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled'));

-- Tornar dimensões nullable para campanhas (serão populadas via agregação)
-- As dimensões já existem com valores obrigatórios, mas campanhas iniciam sem dados
ALTER TABLE nr1_risk_assessments
  ALTER COLUMN workload_pace_risk DROP NOT NULL,
  ALTER COLUMN goal_pressure_risk DROP NOT NULL,
  ALTER COLUMN role_clarity_risk DROP NOT NULL,
  ALTER COLUMN autonomy_control_risk DROP NOT NULL,
  ALTER COLUMN leadership_support_risk DROP NOT NULL,
  ALTER COLUMN peer_collaboration_risk DROP NOT NULL,
  ALTER COLUMN recognition_justice_risk DROP NOT NULL,
  ALTER COLUMN communication_change_risk DROP NOT NULL,
  ALTER COLUMN conflict_harassment_risk DROP NOT NULL,
  ALTER COLUMN recovery_boundaries_risk DROP NOT NULL;

-- Índice para buscar campanhas
CREATE INDEX IF NOT EXISTS idx_nr1_campaigns ON nr1_risk_assessments(org_id, is_campaign, status)
  WHERE is_campaign = TRUE;

COMMENT ON COLUMN nr1_risk_assessments.campaign_name IS 'Nome da campanha NR-1 (ex: "Avaliação Q1 2026")';
COMMENT ON COLUMN nr1_risk_assessments.scope IS 'Escopo: organization (toda empresa), team (time específico), department (departamento)';
COMMENT ON COLUMN nr1_risk_assessments.scope_target IS 'ID do time ou nome do departamento (quando scope != organization)';
COMMENT ON COLUMN nr1_risk_assessments.is_campaign IS 'TRUE = campanha com coleta de respostas, FALSE = avaliação manual legada';
COMMENT ON COLUMN nr1_risk_assessments.status IS 'Status da campanha: draft, active, completed, cancelled';
