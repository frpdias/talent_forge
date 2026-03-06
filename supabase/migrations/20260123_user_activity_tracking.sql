-- Tabela para tracking de atividade de usuários
-- Arquivo: 20260123_user_activity_tracking.sql
-- Data: 2026-01-23

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (para permitir re-execução)
DROP POLICY IF EXISTS "Admins can view all activity" ON user_activity;
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
DROP POLICY IF EXISTS "Service role can insert activity" ON user_activity;

-- Policy: Admins podem ver tudo
CREATE POLICY "Admins can view all activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Policy: Usuários podem ver sua própria atividade
CREATE POLICY "Users can view own activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Sistema pode inserir (service role)
CREATE POLICY "Service role can insert activity"
  ON user_activity
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Função para limpar atividades antigas (>90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_user_activity()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_activity
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Comentários
COMMENT ON TABLE user_activity IS 'Tracking de atividades dos usuários para métricas e analytics';
COMMENT ON COLUMN user_activity.action IS 'Tipo de ação: page_view, click, api_call, etc';
COMMENT ON COLUMN user_activity.resource IS 'Recurso acessado: /dashboard, /jobs/123, etc';
COMMENT ON COLUMN user_activity.metadata IS 'Dados adicionais da ação em formato JSON';
COMMENT ON FUNCTION cleanup_old_user_activity() IS 'Remove atividades com mais de 90 dias';
