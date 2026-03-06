-- Proteger audit_logs contra DELETE não autorizado
-- Arquivo: 20260124_lock_audit_logs_security.sql
-- Data: 2026-01-24
-- Prioridade: P0

-- 1. Policy: Ninguém pode deletar audit logs (exceto service_role)
DROP POLICY IF EXISTS "Nobody can delete audit logs" ON audit_logs;
CREATE POLICY "Nobody can delete audit logs"
  ON audit_logs
  FOR DELETE
  TO authenticated
  USING (false);  -- Bloqueia DELETE para todos os usuários autenticados

-- 2. Policy: Service role pode deletar apenas logs muito antigos (compliance)
DROP POLICY IF EXISTS "Service role can delete old audit logs" ON audit_logs;
CREATE POLICY "Service role can delete old audit logs"
  ON audit_logs
  FOR DELETE
  TO service_role
  USING (created_at < NOW() - INTERVAL '2 years');  -- Apenas logs > 2 anos

-- 3. Função para registrar tentativas de DELETE
CREATE OR REPLACE FUNCTION log_audit_deletion_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Registra tentativa suspeita de deletar audit log
  INSERT INTO security_events (type, severity, details)
  VALUES (
    'audit_log_deletion_attempt',
    'critical',
    jsonb_build_object(
      'attempted_by', auth.uid(),
      'attempted_deletion_of', OLD.id,
      'log_action', OLD.action,
      'log_resource', OLD.resource,
      'log_created_at', OLD.created_at,
      'timestamp', NOW(),
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  );
  
  -- Cancela o DELETE
  RETURN NULL;
END;
$$;

-- 4. Trigger para prevenir DELETE não autorizado
DROP TRIGGER IF EXISTS prevent_audit_deletion_trigger ON audit_logs;
CREATE TRIGGER prevent_audit_deletion_trigger
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  WHEN (current_setting('role') != 'service_role')
  EXECUTE FUNCTION log_audit_deletion_attempt();

-- 5. Função auxiliar para limpeza programática (apenas via service_role)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 730)
RETURNS TABLE(deleted_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  del_count BIGINT;
BEGIN
  -- Apenas service_role pode executar
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Only service_role can cleanup audit logs';
  END IF;
  
  -- Deletar logs antigos
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS del_count = ROW_COUNT;
  
  -- Registrar limpeza
  INSERT INTO audit_logs (actor_id, action, resource, metadata)
  VALUES (
    NULL,
    'cleanup',
    'audit_logs',
    jsonb_build_object(
      'deleted_count', del_count,
      'retention_days', retention_days,
      'executed_at', NOW()
    )
  );
  
  RETURN QUERY SELECT del_count;
END;
$$;

-- 6. Comentários
COMMENT ON FUNCTION log_audit_deletion_attempt() IS 'Registra tentativas de deletar audit logs e cancela a operação';
COMMENT ON FUNCTION cleanup_old_audit_logs(INTEGER) IS 'Limpeza programática de audit logs antigos (apenas service_role)';
COMMENT ON POLICY "Nobody can delete audit logs" ON audit_logs IS 'Previne DELETE por usuários comuns';
COMMENT ON POLICY "Service role can delete old audit logs" ON audit_logs IS 'Permite limpeza de logs > 2 anos';
