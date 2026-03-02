-- Sprint 24: Fix COPC views + indicadores por empresa/área/cargo
-- 1. v_copc_summary agora inclui TODAS as 11 métricas
-- 2. Nova view v_copc_indicators para indicadores por empresa, área (dept) e cargo

-- =====================================================================
-- 1. REBUILD v_copc_summary com todas as métricas
-- DROP necessário porque CREATE OR REPLACE não permite renomear colunas
-- =====================================================================

DROP VIEW IF EXISTS v_copc_summary;
CREATE VIEW v_copc_summary AS
SELECT 
  c.org_id,
  c.team_id,
  t.name AS team_name,
  c.metric_date,
  -- Quality (35%)
  ROUND(AVG(c.quality_score), 2) AS avg_quality,
  ROUND(AVG(c.rework_rate), 2) AS avg_rework_rate,
  -- Efficiency (20%)
  ROUND(AVG(c.process_adherence_rate), 2) AS avg_efficiency,
  ROUND(AVG(c.average_handle_time), 2) AS avg_handle_time,
  -- Effectiveness (20%)
  ROUND(AVG(c.first_call_resolution_rate), 2) AS avg_effectiveness,
  ROUND(AVG(c.delivery_consistency), 2) AS avg_delivery_consistency,
  -- CX (15%)
  ROUND(AVG(c.customer_satisfaction_score), 2) AS avg_cx,
  ROUND(AVG(c.nps_score), 2) AS avg_nps,
  -- People (10%)
  ROUND(AVG(c.absenteeism_rate), 2) AS avg_absenteeism,
  ROUND(AVG(c.engagement_score), 2) AS avg_engagement,
  ROUND(AVG(c.operational_stress_level), 2) AS avg_stress_level,
  -- Score geral
  ROUND(AVG(c.overall_performance_score), 2) AS avg_copc_score,
  COUNT(c.id) AS metrics_count
FROM copc_metrics c
LEFT JOIN teams t ON c.team_id = t.id
GROUP BY c.org_id, c.team_id, t.name, c.metric_date;

COMMENT ON VIEW v_copc_summary IS 'Resumo COPC por org/time/data com TODAS as 11 métricas';

-- =====================================================================
-- 2. VIEW: Indicadores COPC por Empresa, Área (departamento) e Cargo
-- Faz JOIN com employees para trazer department e position
-- =====================================================================

CREATE OR REPLACE VIEW v_copc_indicators AS
SELECT
  c.org_id,
  o.name AS organization_name,
  -- Área: tenta employee.department, fallback para team.name
  COALESCE(e.department, t.name, 'Sem Área') AS area,
  -- Cargo: employee.position
  COALESCE(e.position, 'Sem Cargo') AS cargo,
  -- Métricas agregadas
  ROUND(AVG(c.quality_score), 2) AS avg_quality,
  ROUND(AVG(c.rework_rate), 2) AS avg_rework_rate,
  ROUND(AVG(c.process_adherence_rate), 2) AS avg_efficiency,
  ROUND(AVG(c.first_call_resolution_rate), 2) AS avg_effectiveness,
  ROUND(AVG(c.customer_satisfaction_score), 2) AS avg_cx,
  ROUND(AVG(c.nps_score), 2) AS avg_nps,
  ROUND(AVG(c.absenteeism_rate), 2) AS avg_absenteeism,
  ROUND(AVG(c.engagement_score), 2) AS avg_engagement,
  ROUND(AVG(c.overall_performance_score), 2) AS avg_copc_score,
  COUNT(c.id) AS metrics_count,
  COUNT(DISTINCT c.user_id) AS unique_users,
  MIN(c.metric_date) AS first_metric_date,
  MAX(c.metric_date) AS last_metric_date
FROM copc_metrics c
JOIN organizations o ON c.org_id = o.id
LEFT JOIN teams t ON c.team_id = t.id
LEFT JOIN employees e ON c.user_id = e.user_id AND e.organization_id = c.org_id
GROUP BY c.org_id, o.name, COALESCE(e.department, t.name, 'Sem Área'), COALESCE(e.position, 'Sem Cargo');

COMMENT ON VIEW v_copc_indicators IS 'Indicadores COPC agregados por empresa, área (departamento) e cargo';

-- =====================================================================
-- 3. Grants
-- =====================================================================

GRANT SELECT ON v_copc_summary TO anon, authenticated;
GRANT SELECT ON v_copc_indicators TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Sprint 24: v_copc_summary atualizada com 11 métricas, v_copc_indicators criada';
END $$;
