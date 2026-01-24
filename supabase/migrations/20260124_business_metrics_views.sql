-- Views para métricas de negócio
-- Arquivo: 20260124_business_metrics_views.sql
-- Data: 2026-01-24
-- Prioridade: P3

-- =============================================
-- FUNIL DE RECRUTAMENTO
-- =============================================

CREATE OR REPLACE VIEW v_recruitment_funnel AS
SELECT 
  j.id as job_id,
  j.org_id,
  j.title as job_title,
  j.status as job_status,
  j.created_at as job_created_at,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'in_process' THEN a.id END) as in_process_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END) as hired_count,
  COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) as rejected_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT a.id), 0) * 100, 
    2
  ) as conversion_rate,
  ROUND(
    (AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 86400)
    FILTER (WHERE a.status = 'hired'))::NUMERIC,
    1
  ) as avg_days_to_hire
FROM jobs j
LEFT JOIN applications a ON a.job_id = j.id
GROUP BY j.id, j.org_id, j.title, j.status, j.created_at;

COMMENT ON VIEW v_recruitment_funnel IS 'Funil de recrutamento: conversões e métricas por vaga';

-- =============================================
-- TEMPO MÉDIO POR ESTÁGIO
-- =============================================

CREATE OR REPLACE VIEW v_avg_time_by_stage AS
WITH stage_transitions AS (
  SELECT
    ae.application_id,
    ae.from_stage_id,
    ae.to_stage_id,
    ps.name as stage_name,
    ps.position,
    ae.created_at as entered_at,
    LEAD(ae.created_at) OVER (
      PARTITION BY ae.application_id 
      ORDER BY ae.created_at
    ) as exited_at
  FROM application_events ae
  JOIN pipeline_stages ps ON ps.id = ae.to_stage_id
  WHERE ae.from_stage_id IS NOT NULL AND ae.to_stage_id IS NOT NULL
)
SELECT
  stage_name,
  position,
  COUNT(*) as transitions_count,
  ROUND(
    (AVG(EXTRACT(EPOCH FROM (exited_at - entered_at)) / 86400)
    FILTER (WHERE exited_at IS NOT NULL))::NUMERIC,
    1
  ) as avg_days_in_stage,
  ROUND(
    (PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (exited_at - entered_at)) / 86400
    ) FILTER (WHERE exited_at IS NOT NULL))::NUMERIC,
    1
  ) as median_days_in_stage
FROM stage_transitions
GROUP BY stage_name, position
ORDER BY position;

COMMENT ON VIEW v_avg_time_by_stage IS 'Tempo médio que candidatos ficam em cada estágio';

-- =============================================
-- PERFORMANCE DE RECRUTADORES
-- =============================================

CREATE OR REPLACE VIEW v_recruiter_performance AS
SELECT
  up.id as recruiter_id,
  up.full_name as recruiter_name,
  up.email as recruiter_email,
  om.org_id,
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'open') as open_jobs,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'hired') as total_hires,
  ROUND(
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'hired')::NUMERIC /
    NULLIF(COUNT(DISTINCT a.id), 0) * 100,
    2
  ) as hire_rate,
  ROUND(
    (AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 86400)
    FILTER (WHERE a.status = 'hired'))::NUMERIC,
    1
  ) as avg_days_to_hire
FROM user_profiles up
JOIN org_members om ON om.user_id = up.id
LEFT JOIN jobs j ON j.org_id = om.org_id AND j.created_by = up.id
LEFT JOIN applications a ON a.job_id = j.id
WHERE up.user_type = 'recruiter'
  AND om.status = 'active'
GROUP BY up.id, up.full_name, up.email, om.org_id;

COMMENT ON VIEW v_recruiter_performance IS 'Métricas de performance por recrutador';

-- =============================================
-- CANDIDATOS MAIS ATIVOS
-- =============================================

CREATE OR REPLACE VIEW v_top_candidates AS
SELECT
  c.id as candidate_id,
  c.full_name as candidate_name,
  c.email as candidate_email,
  cp.phone,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'applied') as active_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'hired') as hired_count,
  MAX(a.created_at) as last_application_date,
  ARRAY_AGG(DISTINCT j.title) FILTER (WHERE a.status = 'applied') as active_in_jobs
FROM candidates c
LEFT JOIN candidate_profiles cp ON cp.user_id = c.user_id
LEFT JOIN applications a ON a.candidate_id = c.id
LEFT JOIN jobs j ON j.id = a.job_id
GROUP BY c.id, c.full_name, c.email, cp.phone
HAVING COUNT(DISTINCT a.id) > 0
ORDER BY COUNT(DISTINCT a.id) DESC;

COMMENT ON VIEW v_top_candidates IS 'Candidatos mais ativos por número de candidaturas';

-- =============================================
-- ASSESSMENTS COMPLETION RATE
-- =============================================

CREATE OR REPLACE VIEW v_assessment_completion_rate AS
SELECT
  ai.org_id,
  ai.job_id,
  j.title as job_title,
  COUNT(DISTINCT ai.id) as invitations_sent,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_count,
  ROUND(
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::NUMERIC /
    NULLIF(COUNT(DISTINCT ai.id), 0) * 100,
    2
  ) as completion_rate,
  ROUND(
    (AVG(EXTRACT(EPOCH FROM (a.completed_at - ai.created_at)) / 3600)
    FILTER (WHERE a.status = 'completed'))::NUMERIC,
    1
  ) as avg_hours_to_complete
FROM assessment_invitations ai
LEFT JOIN assessments a ON a.invitation_id = ai.id
LEFT JOIN jobs j ON j.id = ai.job_id
GROUP BY ai.org_id, ai.job_id, j.title;

COMMENT ON VIEW v_assessment_completion_rate IS 'Taxa de conclusão de assessments';

-- =============================================
-- DASHBOARD EXECUTIVO
-- =============================================

CREATE OR REPLACE VIEW v_executive_dashboard AS
WITH stats AS (
  SELECT
    o.id as org_id,
    o.name as org_name,
    COUNT(DISTINCT om.user_id) FILTER (WHERE om.status = 'active') as active_users,
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'open') as open_jobs,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'hired') as total_hires,
    COUNT(DISTINCT c.id) as total_candidates,
    MAX(a.created_at) as last_application_date
  FROM organizations o
  LEFT JOIN org_members om ON om.org_id = o.id
  LEFT JOIN jobs j ON j.org_id = o.id
  LEFT JOIN applications a ON a.job_id = j.id
  LEFT JOIN candidates c ON c.id = a.candidate_id
  WHERE o.status = 'active'
  GROUP BY o.id, o.name
)
SELECT
  *,
  ROUND(
    total_hires::NUMERIC / NULLIF(total_applications, 0) * 100,
    2
  ) as overall_hire_rate,
  ROUND(
    total_applications::NUMERIC / NULLIF(open_jobs, 0),
    1
  ) as avg_applications_per_job
FROM stats;

COMMENT ON VIEW v_executive_dashboard IS 'Dashboard executivo com KPIs principais';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT ON v_recruitment_funnel TO authenticated;
GRANT SELECT ON v_avg_time_by_stage TO authenticated;
GRANT SELECT ON v_recruiter_performance TO authenticated;
GRANT SELECT ON v_top_candidates TO authenticated;
GRANT SELECT ON v_assessment_completion_rate TO authenticated;
GRANT SELECT ON v_executive_dashboard TO authenticated;
