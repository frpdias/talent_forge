-- ============================================================
-- job_alerts: tabela para alertas de vagas por e-mail
-- Criada em Sprint 50 (2026-03-18) — Épico 3 Portal de Vagas
-- ============================================================

CREATE TABLE IF NOT EXISTS job_alerts (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        NOT NULL,
  search_params JSONB       NOT NULL DEFAULT '{}'::jsonb,
  -- Estrutura do search_params:
  -- { q, loc, type, modality, industry, seniority, salary }
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS job_alerts_email_idx
  ON job_alerts (email);

CREATE INDEX IF NOT EXISTS job_alerts_active_idx
  ON job_alerts (is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS job_alerts_created_idx
  ON job_alerts (created_at DESC);

-- RLS
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode criar um alerta (anon + authenticated)
CREATE POLICY "job_alerts_insert_public"
  ON job_alerts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas o próprio usuário autenticado pode ver seus alertas
CREATE POLICY "job_alerts_select_own"
  ON job_alerts
  FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- Apenas o próprio usuário autenticado pode desativar seus alertas
CREATE POLICY "job_alerts_update_own"
  ON job_alerts
  FOR UPDATE
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

-- Comentário na tabela
COMMENT ON TABLE job_alerts IS
  'Alertas de e-mail para novas vagas. Candidatos informam filtros (busca, modalidade, área, salário) e recebem notificações quando novas vagas publicadas correspondem.';
