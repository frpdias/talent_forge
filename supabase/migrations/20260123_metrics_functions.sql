-- Função para obter conexões ativas
-- Requer permissões para acessar pg_stat_activity
-- Arquivo: 20260123_metrics_functions.sql

CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT count(*)::INTEGER 
    FROM pg_stat_activity 
    WHERE state = 'active' 
      AND datname = current_database()
      AND pid != pg_backend_pid()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- Permitir execução pública (seguro pois retorna apenas count)
GRANT EXECUTE ON FUNCTION get_active_connections() TO authenticated;

COMMENT ON FUNCTION get_active_connections() IS 'Retorna o número de conexões ativas no banco de dados atual';
