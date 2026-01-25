-- Migration: Organization Metrics Dashboard
-- Data: 2026-01-24
-- Descrição: View e função para métricas de organizações no painel admin

-- =============================================
-- MAPEAMENTO DE TABELAS:
-- organizations: id, name, slug, status, plan_id, created_at, updated_at
-- org_members: id, org_id, user_id, role, status, created_at
-- jobs: id, org_id, title, status, created_at, updated_at
-- candidates: id, owner_org_id, full_name, email, created_at
-- applications: id, job_id, candidate_id, status, created_at (NÃO TEM org_id!)
-- assessments: id, candidate_id, job_id, assessment_kind, raw_score, created_at (NÃO TEM org_id!)
-- application_events: id, application_id, from_stage_id, to_stage_id, created_at
-- =============================================

-- =============================================
-- 1. VIEW: v_org_metrics
-- Agrega todas as métricas de negócio por organização
-- =============================================
CREATE OR REPLACE VIEW v_org_metrics AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.slug,
  o.status,
  o.plan_id,
  o.created_at as org_created_at,
  
  -- Usuários
  COUNT(DISTINCT om.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN om.status = 'active' THEN om.user_id END) as active_users,
  
  -- Vagas
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT CASE WHEN j.status = 'open' THEN j.id END) as active_jobs,
  COUNT(DISTINCT CASE WHEN j.status = 'closed' THEN j.id END) as closed_jobs,
  
  -- Candidatos (através de applications → jobs → org_id)
  COUNT(DISTINCT a.candidate_id) as total_candidates,
  
  -- Candidaturas (através de jobs)
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END) as total_hires,
  
  -- Taxa de conversão (% de contratações sobre candidaturas)
  CASE 
    WHEN COUNT(DISTINCT a.id) > 0 THEN
      ROUND((COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END)::numeric / COUNT(DISTINCT a.id)::numeric) * 100, 2)
    ELSE 0
  END as conversion_rate,
  
  -- Assessments (através de jobs, NÃO tem status!)
  COUNT(DISTINCT ass.id) as total_assessments,
  COUNT(DISTINCT CASE WHEN ass.normalized_score IS NOT NULL THEN ass.id END) as completed_assessments,
  
  -- Eventos do Pipeline (através de applications → jobs)
  COUNT(DISTINCT ae.id) as total_pipeline_events,
  
  -- Atividade recente (últimos 30 dias)
  COUNT(DISTINCT CASE 
    WHEN a.created_at >= NOW() - INTERVAL '30 days' THEN a.id 
  END) as applications_last_30d,
  COUNT(DISTINCT CASE 
    WHEN j.created_at >= NOW() - INTERVAL '30 days' THEN j.id 
  END) as jobs_created_last_30d,
  COUNT(DISTINCT CASE 
    WHEN a.status = 'hired' AND a.updated_at >= NOW() - INTERVAL '30 days' THEN a.id 
  END) as hires_last_30d,
  
  -- Última atividade
  GREATEST(
    MAX(a.created_at),
    MAX(j.created_at),
    MAX(ae.created_at),
    MAX(om.created_at)
  ) as last_activity_at,
  
  -- Estimativa de ocupação de banco (bytes aproximados)
  (
    (COUNT(DISTINCT a.candidate_id) * 2000) +  -- Candidatos: ~2KB cada
    (COUNT(DISTINCT a.id) * 1000) +             -- Applications: ~1KB cada
    (COUNT(DISTINCT j.id) * 3000) +             -- Jobs: ~3KB cada
    (COUNT(DISTINCT ass.id) * 5000) +           -- Assessments: ~5KB cada
    (COUNT(DISTINCT ae.id) * 500)               -- Pipeline events: ~500B cada
  ) as estimated_db_size_bytes

FROM organizations o
LEFT JOIN org_members om ON om.org_id = o.id
LEFT JOIN jobs j ON j.org_id = o.id
LEFT JOIN applications a ON a.job_id = j.id
LEFT JOIN assessments ass ON ass.job_id = j.id
LEFT JOIN application_events ae ON ae.application_id = a.id
GROUP BY o.id, o.name, o.slug, o.status, o.plan_id, o.created_at;

COMMENT ON VIEW v_org_metrics IS 'Métricas agregadas por organização para dashboard admin';

-- =============================================
-- 2. FUNCTION: get_org_storage_usage
-- Calcula ocupação de storage (Supabase Storage)
-- =============================================
CREATE OR REPLACE FUNCTION get_org_storage_usage(p_org_id UUID)
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_size_bytes BIGINT,
  total_size_mb NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função consulta a tabela storage.objects do Supabase
  -- Nota: storage.objects pode não estar acessível diretamente
  -- Se não funcionar, retornar estimativas baseadas em outras tabelas
  
  RETURN QUERY
  SELECT 
    'cvs' as bucket_name,
    0::BIGINT as file_count,
    0::BIGINT as total_size_bytes,
    0::NUMERIC as total_size_mb
  WHERE FALSE; -- Placeholder: implementar quando storage estiver configurado
  
  -- TODO: Quando storage estiver configurado, usar:
  -- SELECT 
  --   bucket_id as bucket_name,
  --   COUNT(*)::BIGINT as file_count,
  --   COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size_bytes,
  --   ROUND(COALESCE(SUM(metadata->>'size')::BIGINT, 0) / 1048576.0, 2) as total_size_mb
  -- FROM storage.objects
  -- WHERE metadata->>'org_id' = p_org_id::TEXT
  -- GROUP BY bucket_id;
  
END;
$$;

COMMENT ON FUNCTION get_org_storage_usage IS 'Calcula ocupação de storage por organização (buckets: cvs, logos, documentos)';

-- =============================================
-- 3. FUNCTION: get_org_detailed_metrics
-- Retorna métricas detalhadas incluindo breakdown de tabelas
-- =============================================
CREATE OR REPLACE FUNCTION get_org_detailed_metrics(p_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'org_id', p_org_id,
    'metrics', (SELECT row_to_json(m) FROM v_org_metrics m WHERE m.org_id = p_org_id),
    'database_breakdown', json_build_object(
      'candidates', (
        SELECT COUNT(DISTINCT a.candidate_id)
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE j.org_id = p_org_id
      ),
      'applications', (
        SELECT COUNT(*)
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE j.org_id = p_org_id
      ),
      'jobs', (SELECT COUNT(*) FROM jobs WHERE org_id = p_org_id),
      'assessments', (
        SELECT COUNT(*) 
        FROM assessments ass
        JOIN jobs j ON j.id = ass.job_id
        WHERE j.org_id = p_org_id
      ),
      'pipeline_events', (
        SELECT COUNT(*) 
        FROM application_events ae
        JOIN applications a ON a.id = ae.application_id
        JOIN jobs j ON j.id = a.job_id
        WHERE j.org_id = p_org_id
      ),
      'org_members', (SELECT COUNT(*) FROM org_members WHERE org_id = p_org_id)
    ),
    'storage_usage', (
      SELECT json_agg(row_to_json(s)) 
      FROM get_org_storage_usage(p_org_id) s
    ),
    'health', json_build_object(
      'status', (SELECT status FROM organizations WHERE id = p_org_id),
      'plan', (SELECT plan_id FROM organizations WHERE id = p_org_id),
      'created_at', (SELECT created_at FROM organizations WHERE id = p_org_id),
      'alerts', json_build_array() -- TODO: Implementar sistema de alertas
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_org_detailed_metrics IS 'Retorna JSON completo com todas as métricas de uma organização';

-- =============================================
-- 4. GRANTS (Permissões de acesso)
-- =============================================
GRANT SELECT ON v_org_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_storage_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_detailed_metrics TO authenticated;

-- =============================================
-- 5. VALIDAÇÃO
-- =============================================
SELECT '✅ Migration aplicada com sucesso!' as message;
SELECT 'View v_org_metrics criada' as status;
SELECT 'Função get_org_storage_usage criada' as status;
SELECT 'Função get_org_detailed_metrics criada' as status;

-- Testar view
SELECT COUNT(*) as orgs_with_metrics FROM v_org_metrics;

-- Testar função
SELECT get_org_detailed_metrics(
  (SELECT id FROM organizations LIMIT 1)
) as sample_metrics;
