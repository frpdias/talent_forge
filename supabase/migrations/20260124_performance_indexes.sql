-- Índices compostos para performance
-- Arquivo: 20260124_performance_indexes.sql
-- Data: 2026-01-24
-- Prioridade: P1

-- =============================================
-- AUDIT LOGS
-- =============================================

-- Query: Filtrar por usuário + período
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_date 
  ON audit_logs(actor_id, created_at DESC) 
  WHERE actor_id IS NOT NULL;

-- Query: Filtrar por ação + período
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date 
  ON audit_logs(action, created_at DESC);

-- Query: Filtrar por recurso + período
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_date 
  ON audit_logs(resource, created_at DESC);

-- Query: Busca combinada (usuário + ação + período)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action_date 
  ON audit_logs(actor_id, action, created_at DESC) 
  WHERE actor_id IS NOT NULL;

-- =============================================
-- SECURITY EVENTS
-- =============================================

-- Query: Eventos críticos/altos recentes
CREATE INDEX IF NOT EXISTS idx_security_events_severity_date 
  ON security_events(severity, created_at DESC) 
  WHERE severity IN ('critical', 'high');

-- Query: Filtrar por tipo + período
CREATE INDEX IF NOT EXISTS idx_security_events_type_date 
  ON security_events(type, created_at DESC);

-- Query: Índice geral por data (removido WHERE com NOW() - não é IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_security_events_date 
  ON security_events(created_at DESC);

-- =============================================
-- USER ACTIVITY
-- =============================================

-- Query: Atividades do usuário + ação
CREATE INDEX IF NOT EXISTS idx_user_activity_user_action_date 
  ON user_activity(user_id, action, created_at DESC);

-- Query: Atividades por ação (para métricas)
CREATE INDEX IF NOT EXISTS idx_user_activity_action_date 
  ON user_activity(action, created_at DESC);

-- Query: Índice geral por data (removido WHERE com NOW() - não é IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_user_activity_date 
  ON user_activity(created_at DESC);

-- =============================================
-- SYSTEM SETTINGS
-- =============================================

-- Query: Buscar por categoria
CREATE INDEX IF NOT EXISTS idx_system_settings_category_key 
  ON system_settings(category, key);

-- Query: Settings públicas
CREATE INDEX IF NOT EXISTS idx_system_settings_public 
  ON system_settings(is_public, key) 
  WHERE is_public = true;

-- =============================================
-- ORGANIZATIONS
-- =============================================

-- Query: Busca por slug (URLs amigáveis)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug 
  ON organizations(slug) 
  WHERE slug IS NOT NULL;

-- Query: Organizações ativas
CREATE INDEX IF NOT EXISTS idx_organizations_status_active 
  ON organizations(status, created_at DESC) 
  WHERE status = 'active';

-- Query: Busca por CNPJ
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_cnpj_unique 
  ON organizations(cnpj) 
  WHERE cnpj IS NOT NULL;

-- =============================================
-- APPLICATIONS (ATS Core)
-- =============================================

-- Query: Candidaturas por job + status
CREATE INDEX IF NOT EXISTS idx_applications_job_status 
  ON applications(job_id, status, created_at DESC);

-- Query: Candidaturas do candidato
CREATE INDEX IF NOT EXISTS idx_applications_candidate_date 
  ON applications(candidate_id, created_at DESC);

-- Query: Candidaturas por estágio
CREATE INDEX IF NOT EXISTS idx_applications_stage 
  ON applications(current_stage_id, status);

-- =============================================
-- APPLICATION EVENTS
-- =============================================

-- Query: Histórico de uma candidatura
CREATE INDEX IF NOT EXISTS idx_application_events_app_date 
  ON application_events(application_id, created_at DESC);

-- Query: Eventos por tipo
CREATE INDEX IF NOT EXISTS idx_application_events_type 
  ON application_events(event_type, created_at DESC);

-- =============================================
-- JOBS
-- =============================================

-- Query: Vagas abertas por organização
CREATE INDEX IF NOT EXISTS idx_jobs_org_status 
  ON jobs(org_id, status, created_at DESC) 
  WHERE status = 'open';

-- Query: Vagas por slug
CREATE INDEX IF NOT EXISTS idx_jobs_slug 
  ON jobs(slug);

-- =============================================
-- BLOCKED IPS
-- =============================================

-- Query: Buscar por IP address (único)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_ips_ip 
  ON blocked_ips(ip_address);

-- =============================================
-- CANDIDATE PROFILES
-- =============================================

-- Query: Perfil por user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_profiles_user 
  ON candidate_profiles(user_id);

-- =============================================
-- Comentários
-- =============================================

COMMENT ON INDEX idx_audit_logs_actor_date IS 'Otimiza queries de audit logs por usuário';
COMMENT ON INDEX idx_security_events_severity_date IS 'Otimiza queries de eventos críticos';
COMMENT ON INDEX idx_user_activity_user_action_date IS 'Otimiza tracking de atividades';
COMMENT ON INDEX idx_organizations_slug IS 'URLs amigáveis para organizations';
COMMENT ON INDEX idx_applications_job_status IS 'Pipeline de candidaturas otimizado';
