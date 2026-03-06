-- Tabela para tracking de IPs bloqueados
-- Arquivo: 20260123_blocked_ips_tracking.sql
-- Data: 2026-01-23

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_until ON blocked_ips(blocked_until);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_created_at ON blocked_ips(created_at DESC);

-- RLS Policies
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (para permitir re-execução)
DROP POLICY IF EXISTS "Admins can view blocked IPs" ON blocked_ips;
DROP POLICY IF EXISTS "Admins can insert blocked IPs" ON blocked_ips;
DROP POLICY IF EXISTS "Admins can update blocked IPs" ON blocked_ips;
DROP POLICY IF EXISTS "Service role can manage blocked IPs" ON blocked_ips;

-- Policy: Apenas admins podem ver IPs bloqueados
CREATE POLICY "Admins can view blocked IPs"
  ON blocked_ips
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Policy: Apenas admins podem inserir
CREATE POLICY "Admins can insert blocked IPs"
  ON blocked_ips
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
CREATE POLICY "Admins can update blocked IPs"
  ON blocked_ips
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

-- Policy: Sistema pode inserir (service role)
CREATE POLICY "Service role can manage blocked IPs"
  ON blocked_ips
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Função para verificar se IP está bloqueado
CREATE OR REPLACE FUNCTION is_ip_blocked(check_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip_address = check_ip
    AND is_active = true
    AND (blocked_until IS NULL OR blocked_until > NOW())
  );
END;
$$;

-- Função para desbloquear IPs expirados automaticamente
CREATE OR REPLACE FUNCTION unblock_expired_ips()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE blocked_ips
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE 
    is_active = true
    AND blocked_until IS NOT NULL
    AND blocked_until < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_blocked_ips_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists (para permitir re-execução)
DROP TRIGGER IF EXISTS update_blocked_ips_updated_at_trigger ON blocked_ips;

CREATE TRIGGER update_blocked_ips_updated_at_trigger
  BEFORE UPDATE ON blocked_ips
  FOR EACH ROW
  EXECUTE FUNCTION update_blocked_ips_updated_at();

-- Comentários
COMMENT ON TABLE blocked_ips IS 'IPs bloqueados por motivos de segurança';
COMMENT ON COLUMN blocked_ips.reason IS 'Motivo do bloqueio: brute_force, suspicious_activity, manual_block, etc';
COMMENT ON COLUMN blocked_ips.blocked_until IS 'Data de expiração do bloqueio (NULL = permanente)';
COMMENT ON COLUMN blocked_ips.metadata IS 'Informações adicionais: tentativas, último acesso, etc';
COMMENT ON COLUMN blocked_ips.is_active IS 'Se o bloqueio está ativo (desativado automaticamente após expiração)';
COMMENT ON FUNCTION is_ip_blocked(INET) IS 'Verifica se um IP está bloqueado atualmente';
COMMENT ON FUNCTION unblock_expired_ips() IS 'Desbloqueia automaticamente IPs com bloqueio expirado';
