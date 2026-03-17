-- =====================================================================
-- Job Board Global: RPC get_all_public_jobs()
-- Retorna todas as vagas públicas de todas as orgs (sem filtro de org)
-- Usado em /vagas — board público geral da plataforma
-- 2026-03-17
-- =====================================================================

CREATE OR REPLACE FUNCTION get_all_public_jobs()
RETURNS SETOF v_public_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM v_public_jobs ORDER BY created_at DESC;
$$;

COMMENT ON FUNCTION get_all_public_jobs IS 'Retorna todas as vagas públicas de todas as orgs — SECURITY DEFINER, sem autenticação necessária';

-- Garantir que a função seja acessível pelo role anon e authenticated
GRANT EXECUTE ON FUNCTION get_all_public_jobs() TO anon;
GRANT EXECUTE ON FUNCTION get_all_public_jobs() TO authenticated;
