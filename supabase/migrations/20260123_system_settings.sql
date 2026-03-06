-- Tabela para configurações do sistema
-- Arquivo: 20260123_system_settings.sql
-- Data: 2026-01-23

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at DESC);

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (para permitir re-execução)
DROP POLICY IF EXISTS "Admins can view all settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON system_settings;
DROP POLICY IF EXISTS "Public settings are visible to all" ON system_settings;
DROP POLICY IF EXISTS "Service role can manage settings" ON system_settings;

-- Policy: Admins podem ver todas as configurações
CREATE POLICY "Admins can view all settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Policy: Configurações públicas são visíveis para todos autenticados
CREATE POLICY "Public settings are visible to all"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Policy: Apenas admins podem inserir
CREATE POLICY "Admins can insert settings"
  ON system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Policy: Apenas admins podem atualizar
CREATE POLICY "Admins can update settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Policy: Service role pode gerenciar tudo
CREATE POLICY "Service role can manage settings"
  ON system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists (para permitir re-execução)
DROP TRIGGER IF EXISTS update_system_settings_updated_at_trigger ON system_settings;

CREATE TRIGGER update_system_settings_updated_at_trigger
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- Função helper para obter configuração
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT value INTO setting_value
  FROM system_settings
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$;

-- Função helper para definir configuração
CREATE OR REPLACE FUNCTION set_setting(setting_key TEXT, setting_value JSONB, setting_category TEXT DEFAULT 'general')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO system_settings (key, value, category)
  VALUES (setting_key, setting_value, setting_category)
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = setting_value,
    updated_at = NOW(),
    updated_by = auth.uid();
  
  SELECT jsonb_build_object(
    'key', key,
    'value', value,
    'category', category,
    'updated_at', updated_at
  ) INTO result
  FROM system_settings
  WHERE key = setting_key;
  
  RETURN result;
END;
$$;

-- Permitir execução das funções
GRANT EXECUTE ON FUNCTION get_setting(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_setting(TEXT, JSONB, TEXT) TO authenticated;

-- Inserir configurações padrão
INSERT INTO system_settings (key, value, category, description, is_public) VALUES
  -- Notificações
  ('notifications.email_enabled', '{"enabled": true}'::JSONB, 'notifications', 'Habilitar notificações por email', false),
  ('notifications.security_alerts', '{"enabled": true}'::JSONB, 'notifications', 'Alertas de segurança', false),
  ('notifications.system_updates', '{"enabled": true}'::JSONB, 'notifications', 'Atualizações do sistema', false),
  
  -- Segurança
  ('security.session_timeout', '{"minutes": 30}'::JSONB, 'security', 'Timeout de sessão em minutos', false),
  ('security.password_expiry', '{"days": 90}'::JSONB, 'security', 'Expiração de senha em dias', false),
  ('security.mfa_required_admin', '{"enabled": false}'::JSONB, 'security', 'MFA obrigatório para admins', false),
  
  -- Sistema
  ('system.maintenance_mode', '{"enabled": false}'::JSONB, 'system', 'Modo manutenção', false),
  ('system.debug_mode', '{"enabled": false}'::JSONB, 'system', 'Modo debug', false),
  ('system.log_level', '{"level": "info"}'::JSONB, 'system', 'Nível de log', false),
  
  -- Geral
  ('general.site_name', '{"name": "TalentForge"}'::JSONB, 'general', 'Nome da plataforma', true),
  ('general.timezone', '{"timezone": "America/Sao_Paulo"}'::JSONB, 'general', 'Fuso horário', true),
  ('general.language', '{"language": "pt-BR"}'::JSONB, 'general', 'Idioma padrão', true),
  
  -- SMTP
  ('smtp.server', '{"server": ""}'::JSONB, 'smtp', 'Servidor SMTP', false),
  ('smtp.port', '{"port": 587}'::JSONB, 'smtp', 'Porta SMTP', false),
  ('smtp.username', '{"username": ""}'::JSONB, 'smtp', 'Usuário SMTP', false)
ON CONFLICT (key) DO NOTHING;

-- Comentários
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';
COMMENT ON COLUMN system_settings.key IS 'Chave única da configuração (ex: notifications.email_enabled)';
COMMENT ON COLUMN system_settings.value IS 'Valor da configuração em formato JSON';
COMMENT ON COLUMN system_settings.category IS 'Categoria: notifications, security, system, general, smtp';
COMMENT ON COLUMN system_settings.is_public IS 'Se a configuração é visível para usuários não-admin';
COMMENT ON FUNCTION get_setting(TEXT) IS 'Retorna o valor de uma configuração pelo key';
COMMENT ON FUNCTION set_setting(TEXT, JSONB, TEXT) IS 'Define ou atualiza uma configuração';
