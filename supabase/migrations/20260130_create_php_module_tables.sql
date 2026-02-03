-- =====================================================================
-- Migration: People, Health & Performance (PHP) Module
-- Version: 1.0
-- Date: 2026-01-30
-- Description: Cria estrutura completa do módulo PHP integrando
--              TFCI (comportamento) + NR-1 (riscos psicossociais) + 
--              COPC Adaptado (performance operacional)
-- =====================================================================

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

-- Criar tipos apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status') THEN
    CREATE TYPE assessment_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metric_source') THEN
    CREATE TYPE metric_source AS ENUM ('manual', 'api', 'integration', 'calculated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_level') THEN
    CREATE TYPE alert_level AS ENUM ('none', 'watch', 'warning', 'critical');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_plan_status') THEN
    CREATE TYPE action_plan_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'copc_category') THEN
    CREATE TYPE copc_category AS ENUM ('quality', 'efficiency', 'effectiveness', 'cx', 'people');
  END IF;
END $$;

-- =====================================================================
-- 2. TABELA: php_module_activations
-- Controle de ativação do módulo PHP por organização (Fartech only)
-- =====================================================================

CREATE TABLE IF NOT EXISTS php_module_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  activation_plan TEXT CHECK (activation_plan IN ('tfci_only', 'nr1_only', 'copc_only', 'full')) DEFAULT 'full',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_php_activations_org_id ON php_module_activations(org_id);
CREATE INDEX IF NOT EXISTS idx_php_activations_is_active ON php_module_activations(is_active);

COMMENT ON TABLE php_module_activations IS 'Toggle de ativação do módulo PHP por organização (controle Fartech)';
COMMENT ON COLUMN php_module_activations.activation_plan IS 'Plano de ativação: tfci_only, nr1_only, copc_only ou full';
COMMENT ON COLUMN php_module_activations.settings IS 'Configurações customizadas do módulo (pesos, gatilhos, alertas)';

-- =====================================================================
-- 3. TABELAS: teams e team_members
-- Estrutura de equipes para análises coletivas
-- =====================================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id),
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT teams_org_name_unique UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_org_id ON teams(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);

COMMENT ON TABLE teams IS 'Times/Equipes para agrupamento de colaboradores em análises PHP';

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_in_team TEXT CHECK (role_in_team IN ('member', 'lead', 'coordinator')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

COMMENT ON TABLE team_members IS 'Relacionamento usuário-time (muitos para muitos)';

-- =====================================================================
-- 4. TABELA: nr1_dimensions
-- Catálogo das 10 dimensões NR-1 v1.0 (riscos psicossociais)
-- =====================================================================

CREATE TABLE IF NOT EXISTS nr1_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nr1_dimensions_code ON nr1_dimensions(code);
CREATE INDEX IF NOT EXISTS idx_nr1_dimensions_order_index ON nr1_dimensions(order_index);

COMMENT ON TABLE nr1_dimensions IS 'Catálogo das 10 dimensões NR-1 v1.0 validadas com Fartech';

-- Seed inicial das 10 dimensões NR-1 v1.0
INSERT INTO nr1_dimensions (code, name, description, order_index) VALUES
  ('workload_pace', 'Carga de Trabalho & Ritmo', 'Volume de trabalho, prazos e ritmo de execução', 1),
  ('goal_pressure', 'Pressão por Metas & Tempo', 'Pressão para atingir metas e cumprir prazos', 2),
  ('role_clarity', 'Clareza de Papéis & Expectativas', 'Clareza sobre responsabilidades e expectativas', 3),
  ('autonomy_control', 'Autonomia & Controle', 'Grau de autonomia e controle sobre o trabalho', 4),
  ('leadership_support', 'Suporte da Liderança', 'Apoio, feedback e reconhecimento da liderança', 5),
  ('peer_collaboration', 'Suporte entre Colegas / Colaboração', 'Qualidade das relações e colaboração entre pares', 6),
  ('recognition_justice', 'Reconhecimento & Justiça Percebida', 'Percepção de reconhecimento e justiça organizacional', 7),
  ('communication_change', 'Comunicação & Mudanças', 'Qualidade da comunicação e gestão de mudanças', 8),
  ('conflict_harassment', 'Conflitos / Assédio / Relações Difíceis', 'Presença de conflitos, assédio ou relações interpessoais difíceis', 9),
  ('recovery_boundaries', 'Recuperação & Limites', 'Capacidade de descanso, desconexão e recuperação', 10)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 5. TABELAS: tfci_cycles e tfci_assessments
-- TFCI (Talent Forge Cultural Index) - Avaliação comportamental coletiva
-- =====================================================================

CREATE TABLE IF NOT EXISTS tfci_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status assessment_status DEFAULT 'draft',
  participants_count INT DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tfci_cycles_org_id ON tfci_cycles(org_id);
CREATE INDEX IF NOT EXISTS idx_tfci_cycles_status ON tfci_cycles(status);
CREATE INDEX IF NOT EXISTS idx_tfci_cycles_dates ON tfci_cycles(start_date, end_date);

COMMENT ON TABLE tfci_cycles IS 'Ciclos de avaliação TFCI (períodos de avaliação comportamental)';

CREATE TABLE IF NOT EXISTS tfci_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID REFERENCES tfci_cycles(id) ON DELETE CASCADE NOT NULL,
  
  -- Dimensões TFCI (escala 1-5)
  collaboration_score NUMERIC(3,2) CHECK (collaboration_score BETWEEN 1 AND 5),
  communication_score NUMERIC(3,2) CHECK (communication_score BETWEEN 1 AND 5),
  adaptability_score NUMERIC(3,2) CHECK (adaptability_score BETWEEN 1 AND 5),
  accountability_score NUMERIC(3,2) CHECK (accountability_score BETWEEN 1 AND 5),
  leadership_score NUMERIC(3,2) CHECK (leadership_score BETWEEN 1 AND 5),
  
  -- Score geral TFCI (média das 5 dimensões)
  overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
    (collaboration_score + communication_score + adaptability_score + 
     accountability_score + leadership_score) / 5
  ) STORED,
  
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tfci_assessments_org_id ON tfci_assessments(org_id);
CREATE INDEX IF NOT EXISTS idx_tfci_assessments_cycle_id ON tfci_assessments(cycle_id);
CREATE INDEX IF NOT EXISTS idx_tfci_assessments_target_user ON tfci_assessments(target_user_id);
CREATE INDEX IF NOT EXISTS idx_tfci_assessments_team_id ON tfci_assessments(team_id);

COMMENT ON TABLE tfci_assessments IS 'Avaliações comportamentais coletivas (360° simplificado)';
COMMENT ON COLUMN tfci_assessments.is_anonymous IS 'Se TRUE, evaluator_id não é exposto em relatórios';

-- =====================================================================
-- 6. TABELA: nr1_risk_assessments
-- Matriz NR-1 - Riscos Psicossociais (compliance legal)
-- =====================================================================

CREATE TABLE IF NOT EXISTS nr1_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessment_date DATE DEFAULT CURRENT_DATE,
  
  -- Dimensões NR-1 v1.0 (1=Baixo, 2=Médio, 3=Alto)
  -- 10 dimensões validadas com Fartech
  workload_pace_risk INT CHECK (workload_pace_risk BETWEEN 1 AND 3),              -- 1. Carga de trabalho & ritmo
  goal_pressure_risk INT CHECK (goal_pressure_risk BETWEEN 1 AND 3),              -- 2. Pressão por metas & tempo
  role_clarity_risk INT CHECK (role_clarity_risk BETWEEN 1 AND 3),                -- 3. Clareza de papéis & expectativas
  autonomy_control_risk INT CHECK (autonomy_control_risk BETWEEN 1 AND 3),        -- 4. Autonomia & controle
  leadership_support_risk INT CHECK (leadership_support_risk BETWEEN 1 AND 3),    -- 5. Suporte da liderança
  peer_collaboration_risk INT CHECK (peer_collaboration_risk BETWEEN 1 AND 3),    -- 6. Suporte entre colegas / colaboração
  recognition_justice_risk INT CHECK (recognition_justice_risk BETWEEN 1 AND 3),  -- 7. Reconhecimento & justiça percebida
  communication_change_risk INT CHECK (communication_change_risk BETWEEN 1 AND 3),-- 8. Comunicação & mudanças
  conflict_harassment_risk INT CHECK (conflict_harassment_risk BETWEEN 1 AND 3),  -- 9. Conflitos / assédio / relações difíceis
  recovery_boundaries_risk INT CHECK (recovery_boundaries_risk BETWEEN 1 AND 3),  -- 10. Recuperação & limites (descanso/desconexão)
  
  -- Cálculo do nível de risco geral (média das 10 dimensões)
  overall_risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN (workload_pace_risk + goal_pressure_risk + role_clarity_risk +
            autonomy_control_risk + leadership_support_risk + peer_collaboration_risk +
            recognition_justice_risk + communication_change_risk + conflict_harassment_risk +
            recovery_boundaries_risk) / 10.0 >= 2.5 THEN 'high'
      WHEN (workload_pace_risk + goal_pressure_risk + role_clarity_risk +
            autonomy_control_risk + leadership_support_risk + peer_collaboration_risk +
            recognition_justice_risk + communication_change_risk + conflict_harassment_risk +
            recovery_boundaries_risk) / 10.0 >= 1.5 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  
  action_plan TEXT,
  action_plan_status action_plan_status DEFAULT 'open',
  assessed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nr1_assessments_org_id ON nr1_risk_assessments(org_id);
CREATE INDEX IF NOT EXISTS idx_nr1_assessments_team_id ON nr1_risk_assessments(team_id);
CREATE INDEX IF NOT EXISTS idx_nr1_assessments_user_id ON nr1_risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_nr1_assessments_date ON nr1_risk_assessments(org_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_nr1_assessments_risk_level ON nr1_risk_assessments(overall_risk_level);

COMMENT ON TABLE nr1_risk_assessments IS 'Matriz de riscos psicossociais NR-1 (evidência legal para compliance)';
COMMENT ON COLUMN nr1_risk_assessments.overall_risk_level IS 'Nível de risco calculado: low (<1.5), medium (1.5-2.5), high (>2.5)';

-- =====================================================================
-- 7. TABELAS: copc_metrics_catalog e copc_metrics
-- COPC Adaptado - Performance Operacional + Pessoas
-- =====================================================================

CREATE TABLE IF NOT EXISTS copc_metrics_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category copc_category NOT NULL,
  metric_name TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  weight NUMERIC(5,2) CHECK (weight BETWEEN 0 AND 1) DEFAULT 0.5,
  target_value NUMERIC(10,2),
  unit TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, metric_code)
);

CREATE INDEX IF NOT EXISTS idx_copc_catalog_org_id ON copc_metrics_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_copc_catalog_category ON copc_metrics_catalog(category);
CREATE INDEX IF NOT EXISTS idx_copc_catalog_is_active ON copc_metrics_catalog(is_active);

COMMENT ON TABLE copc_metrics_catalog IS 'Catálogo customizável de métricas COPC por organização';
COMMENT ON COLUMN copc_metrics_catalog.weight IS 'Peso da métrica dentro da categoria (soma deve ser 1.0)';

-- Seed inicial de métricas COPC padrão (org_id NULL = template global)
INSERT INTO copc_metrics_catalog (org_id, category, metric_name, metric_code, weight, unit) VALUES
  -- Quality (35%)
  (NULL, 'quality', 'Quality Score', 'qa_score', 0.60, '%'),
  (NULL, 'quality', 'Rework Rate', 'rework_rate', 0.40, '%'),
  
  -- Efficiency (20%)
  (NULL, 'efficiency', 'Process Adherence', 'process_adherence', 0.70, '%'),
  (NULL, 'efficiency', 'Average Handle Time', 'aht', 0.30, 'seconds'),
  
  -- Effectiveness (20%)
  (NULL, 'effectiveness', 'First Call Resolution', 'fcr', 0.60, '%'),
  (NULL, 'effectiveness', 'Delivery Consistency', 'delivery_consistency', 0.40, '%'),
  
  -- Customer Experience (15%)
  (NULL, 'cx', 'Customer Satisfaction', 'csat', 0.70, '%'),
  (NULL, 'cx', 'Net Promoter Score', 'nps', 0.30, 'score'),
  
  -- People (10%)
  (NULL, 'people', 'Absenteeism Rate', 'absenteeism', 0.50, '%'),
  (NULL, 'people', 'Engagement Score', 'engagement', 0.50, 'score')
ON CONFLICT (org_id, metric_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS copc_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  
  -- Qualidade (35%)
  quality_score NUMERIC(5,2) CHECK (quality_score BETWEEN 0 AND 100),
  rework_rate NUMERIC(5,2) CHECK (rework_rate BETWEEN 0 AND 100),
  
  -- Eficiência (20%)
  process_adherence_rate NUMERIC(5,2) CHECK (process_adherence_rate BETWEEN 0 AND 100),
  average_handle_time NUMERIC(10,2), -- segundos
  
  -- Efetividade (20%)
  first_call_resolution_rate NUMERIC(5,2) CHECK (first_call_resolution_rate BETWEEN 0 AND 100),
  delivery_consistency NUMERIC(5,2) CHECK (delivery_consistency BETWEEN 0 AND 100),
  
  -- Customer Experience (15%)
  customer_satisfaction_score NUMERIC(5,2) CHECK (customer_satisfaction_score BETWEEN 0 AND 100),
  nps_score NUMERIC(5,2) CHECK (nps_score BETWEEN -100 AND 100),
  
  -- Pessoas (10%)
  absenteeism_rate NUMERIC(5,2) CHECK (absenteeism_rate BETWEEN 0 AND 100),
  engagement_score NUMERIC(3,2) CHECK (engagement_score BETWEEN 1 AND 5),
  operational_stress_level INT CHECK (operational_stress_level BETWEEN 1 AND 3),
  
  -- COPC v1.0: Pesos validados com Fartech
  -- Quality 35% | Efficiency 20% | Effectiveness 20% | CX 15% | People 10%
  -- Nota: Se operação sem CX, redistribuir 15% → Quality +10%, Effectiveness +5%
  overall_performance_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (COALESCE(quality_score, 0) * 0.35) + 
    (COALESCE(process_adherence_rate, 0) * 0.20) + 
    (COALESCE(first_call_resolution_rate, delivery_consistency, 0) * 0.20) + 
    (COALESCE(customer_satisfaction_score, 0) * 0.15) + 
    ((100 - COALESCE(absenteeism_rate, 0)) * 0.10)
  ) STORED,
  
  notes TEXT,
  source metric_source DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copc_metrics_org_id ON copc_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_copc_metrics_team_id ON copc_metrics(team_id);
CREATE INDEX IF NOT EXISTS idx_copc_metrics_user_id ON copc_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_copc_metrics_date ON copc_metrics(org_id, metric_date DESC);

COMMENT ON TABLE copc_metrics IS 'Indicadores operacionais COPC Adaptado (performance + bem-estar)';
COMMENT ON COLUMN copc_metrics.overall_performance_score IS 'Score COPC calculado (Quality 35% + Efficiency 20% + Effectiveness 20% + CX 15% + People 10%)';

-- =====================================================================
-- 8. TABELA: php_integrated_scores
-- Score PHP Final = TFCI 30% + NR-1 40% + COPC 30%
-- =====================================================================

CREATE TABLE IF NOT EXISTS php_integrated_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  score_date DATE DEFAULT CURRENT_DATE,
  
  -- Componentes do score (0-100)
  tfci_score NUMERIC(5,2) CHECK (tfci_score BETWEEN 0 AND 100),
  nr1_score NUMERIC(5,2) CHECK (nr1_score BETWEEN 0 AND 100),
  copc_score NUMERIC(5,2) CHECK (copc_score BETWEEN 0 AND 100),
  
  -- PHP Score Final (média ponderada)
  -- TFCI 30% | NR-1 40% | COPC 30%
  php_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (COALESCE(tfci_score, 0) * 0.30) + 
    (COALESCE(nr1_score, 0) * 0.40) + 
    (COALESCE(copc_score, 0) * 0.30)
  ) STORED,
  
  trend_vs_previous TEXT CHECK (trend_vs_previous IN ('up', 'down', 'stable')),
  alert_level alert_level DEFAULT 'none',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_php_scores_org_id ON php_integrated_scores(org_id);
CREATE INDEX IF NOT EXISTS idx_php_scores_team_id ON php_integrated_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_php_scores_user_id ON php_integrated_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_php_scores_date ON php_integrated_scores(org_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_php_scores_alert_level ON php_integrated_scores(alert_level);

COMMENT ON TABLE php_integrated_scores IS 'Score PHP integrado (TFCI 30% + NR-1 40% + COPC 30%) - dashboard executivo';
COMMENT ON COLUMN php_integrated_scores.php_score IS 'Score final PHP (0-100): verde >80, amarelo 60-80, vermelho <60';

-- =====================================================================
-- 9. TABELAS: php_action_plans e php_action_items
-- Planos de Ação Integrados (IA-assisted)
-- =====================================================================

CREATE TABLE IF NOT EXISTS php_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Origem da ação
  triggered_by TEXT CHECK (triggered_by IN ('tfci', 'nr1', 'copc', 'manual', 'ai')) NOT NULL,
  risk_level risk_level DEFAULT 'medium',
  
  -- Detalhes
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  recommended_actions JSONB, -- Array de ações sugeridas pela IA
  
  -- Gestão
  assigned_to UUID REFERENCES auth.users(id),
  status action_plan_status DEFAULT 'open',
  priority INT CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Resultados
  effectiveness_score NUMERIC(3,2) CHECK (effectiveness_score BETWEEN 1 AND 5),
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_php_action_plans_org_id ON php_action_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_php_action_plans_team_id ON php_action_plans(team_id);
CREATE INDEX IF NOT EXISTS idx_php_action_plans_assigned_to ON php_action_plans(assigned_to);
CREATE INDEX IF NOT EXISTS idx_php_action_plans_status ON php_action_plans(org_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_php_action_plans_risk_level ON php_action_plans(risk_level);

COMMENT ON TABLE php_action_plans IS 'Planos de ação que cruzam comportamento + saúde + performance (IA sugere ações)';
COMMENT ON COLUMN php_action_plans.triggered_by IS 'Origem: tfci, nr1, copc, manual ou ai (sugestão automática)';
COMMENT ON COLUMN php_action_plans.recommended_actions IS 'Array de ações sugeridas pela IA baseado em padrões históricos';

CREATE TABLE IF NOT EXISTS php_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id UUID REFERENCES php_action_plans(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  status action_plan_status DEFAULT 'open',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_php_action_items_plan_id ON php_action_items(action_plan_id);
CREATE INDEX IF NOT EXISTS idx_php_action_items_assigned_to ON php_action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_php_action_items_status ON php_action_items(status);

COMMENT ON TABLE php_action_items IS 'Tarefas individuais de um plano de ação PHP';

-- =====================================================================
-- 10. RLS POLICIES
-- =====================================================================

-- php_module_activations: Apenas admins globais e org admins
ALTER TABLE php_module_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_php_activation" ON php_module_activations;
CREATE POLICY "admin_manage_php_activation"
ON php_module_activations FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = php_module_activations.org_id 
    AND role IN ('admin', 'owner')
  )
  OR
  (SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

-- teams: Membros da org podem ver, gestores gerenciam
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_teams" ON teams;
CREATE POLICY "members_view_teams"
ON teams FOR SELECT
USING (is_org_member(org_id));

DROP POLICY IF EXISTS "admins_manage_teams" ON teams;
CREATE POLICY "admins_manage_teams"
ON teams FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = teams.org_id 
    AND role IN ('admin', 'owner', 'manager')
  )
);

-- team_members: Membros da org podem ver
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_team_membership" ON team_members;
CREATE POLICY "members_view_team_membership"
ON team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND is_org_member(teams.org_id)
  )
);

DROP POLICY IF EXISTS "managers_manage_team_membership" ON team_members;
CREATE POLICY "managers_manage_team_membership"
ON team_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND (
      teams.manager_id = auth.uid()
      OR auth.uid() IN (
        SELECT user_id FROM org_members 
        WHERE org_id = teams.org_id 
        AND role IN ('admin', 'owner')
      )
    )
  )
);

-- nr1_dimensions: Leitura pública, escrita apenas admins
ALTER TABLE nr1_dimensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_view_nr1_dimensions" ON nr1_dimensions;
CREATE POLICY "public_view_nr1_dimensions"
ON nr1_dimensions FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "admins_manage_nr1_dimensions" ON nr1_dimensions;
CREATE POLICY "admins_manage_nr1_dimensions"
ON nr1_dimensions FOR ALL
USING (
  (SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

-- tfci_cycles: Membros veem, admins gerenciam
ALTER TABLE tfci_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_tfci_cycles" ON tfci_cycles;
CREATE POLICY "members_view_tfci_cycles"
ON tfci_cycles FOR SELECT
USING (is_org_member(org_id));

DROP POLICY IF EXISTS "admins_manage_tfci_cycles" ON tfci_cycles;
CREATE POLICY "admins_manage_tfci_cycles"
ON tfci_cycles FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = tfci_cycles.org_id 
    AND role IN ('admin', 'owner')
  )
);

-- tfci_assessments: Membros criam, gestores veem individuais
ALTER TABLE tfci_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_submit_tfci" ON tfci_assessments;
CREATE POLICY "members_submit_tfci"
ON tfci_assessments FOR INSERT
WITH CHECK (is_org_member(org_id));

DROP POLICY IF EXISTS "managers_view_individual_tfci" ON tfci_assessments;
CREATE POLICY "managers_view_individual_tfci"
ON tfci_assessments FOR SELECT
USING (
  (SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
  OR
  auth.uid() IN (
    SELECT manager_id FROM teams 
    WHERE id = tfci_assessments.team_id
  )
);

-- nr1_risk_assessments: Dados sensíveis - apenas org admins/RH
ALTER TABLE nr1_risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_hr_full_access_nr1" ON nr1_risk_assessments;
CREATE POLICY "admins_hr_full_access_nr1"
ON nr1_risk_assessments FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = nr1_risk_assessments.org_id 
    AND role IN ('admin', 'owner', 'hr')
  )
);

DROP POLICY IF EXISTS "users_view_own_nr1" ON nr1_risk_assessments;
CREATE POLICY "users_view_own_nr1"
ON nr1_risk_assessments FOR SELECT
USING (user_id = auth.uid());

-- copc_metrics_catalog: Admins gerenciam
ALTER TABLE copc_metrics_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_copc_catalog" ON copc_metrics_catalog;
CREATE POLICY "admins_manage_copc_catalog"
ON copc_metrics_catalog FOR ALL
USING (
  org_id IS NULL -- templates globais
  OR
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = copc_metrics_catalog.org_id 
    AND role IN ('admin', 'owner')
  )
);

-- copc_metrics: Gestores inserem e veem suas equipes
ALTER TABLE copc_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "managers_view_team_copc" ON copc_metrics;
CREATE POLICY "managers_view_team_copc"
ON copc_metrics FOR SELECT
USING (
  auth.uid() IN (
    SELECT manager_id FROM teams WHERE id = copc_metrics.team_id
  )
  OR
  is_org_member(org_id)
);

DROP POLICY IF EXISTS "managers_insert_copc" ON copc_metrics;
CREATE POLICY "managers_insert_copc"
ON copc_metrics FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT manager_id FROM teams WHERE id = team_id
  )
  OR
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = copc_metrics.org_id 
    AND role IN ('admin', 'owner')
  )
);

-- php_integrated_scores: Membros veem
ALTER TABLE php_integrated_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_php_scores" ON php_integrated_scores;
CREATE POLICY "members_view_php_scores"
ON php_integrated_scores FOR SELECT
USING (is_org_member(org_id));

DROP POLICY IF EXISTS "system_insert_php_scores" ON php_integrated_scores;
CREATE POLICY "system_insert_php_scores"
ON php_integrated_scores FOR INSERT
WITH CHECK (is_org_member(org_id));

-- php_action_plans: Membros veem, gestores gerenciam
ALTER TABLE php_action_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_action_plans" ON php_action_plans;
CREATE POLICY "members_view_action_plans"
ON php_action_plans FOR SELECT
USING (is_org_member(org_id));

DROP POLICY IF EXISTS "managers_manage_action_plans" ON php_action_plans;
CREATE POLICY "managers_manage_action_plans"
ON php_action_plans FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = php_action_plans.org_id
    AND role IN ('admin', 'owner', 'manager')
  )
);

-- php_action_items: Membros veem, atribuídos atualizam
ALTER TABLE php_action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_action_items" ON php_action_items;
CREATE POLICY "members_view_action_items"
ON php_action_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM php_action_plans 
    WHERE php_action_plans.id = php_action_items.action_plan_id 
    AND is_org_member(php_action_plans.org_id)
  )
);

DROP POLICY IF EXISTS "assigned_update_action_items" ON php_action_items;
CREATE POLICY "assigned_update_action_items"
ON php_action_items FOR UPDATE
USING (
  assigned_to = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM php_action_plans 
    WHERE php_action_plans.id = php_action_items.action_plan_id 
    AND auth.uid() IN (
      SELECT user_id FROM org_members 
      WHERE org_id = php_action_plans.org_id 
      AND role IN ('admin', 'owner', 'manager')
    )
  )
);

-- =====================================================================
-- 11. VIEWS PARA DASHBOARD
-- =====================================================================

-- View: Dashboard PHP (overview executivo)
CREATE OR REPLACE VIEW v_php_dashboard AS
SELECT 
  s.org_id,
  s.team_id,
  s.score_date,
  ROUND(AVG(s.php_score), 2) AS avg_php_score,
  ROUND(AVG(s.tfci_score), 2) AS avg_tfci_score,
  ROUND(AVG(s.nr1_score), 2) AS avg_nr1_score,
  ROUND(AVG(s.copc_score), 2) AS avg_copc_score,
  COUNT(DISTINCT s.user_id) AS users_evaluated,
  COUNT(CASE WHEN s.alert_level = 'critical' THEN 1 END) AS critical_alerts,
  COUNT(CASE WHEN s.alert_level = 'warning' THEN 1 END) AS warning_alerts
FROM php_integrated_scores s
GROUP BY s.org_id, s.team_id, s.score_date;

COMMENT ON VIEW v_php_dashboard IS 'Dashboard executivo PHP com scores agregados e alertas';

-- View: Heatmap NR-1 (riscos por dimensão x equipe)
CREATE OR REPLACE VIEW v_nr1_heatmap AS
SELECT 
  n.org_id,
  n.team_id,
  t.name AS team_name,
  ROUND(AVG(n.workload_pace_risk)::NUMERIC, 2) AS workload_pace_avg,
  ROUND(AVG(n.goal_pressure_risk)::NUMERIC, 2) AS goal_pressure_avg,
  ROUND(AVG(n.role_clarity_risk)::NUMERIC, 2) AS role_clarity_avg,
  ROUND(AVG(n.autonomy_control_risk)::NUMERIC, 2) AS autonomy_control_avg,
  ROUND(AVG(n.leadership_support_risk)::NUMERIC, 2) AS leadership_support_avg,
  ROUND(AVG(n.peer_collaboration_risk)::NUMERIC, 2) AS peer_collaboration_avg,
  ROUND(AVG(n.recognition_justice_risk)::NUMERIC, 2) AS recognition_justice_avg,
  ROUND(AVG(n.communication_change_risk)::NUMERIC, 2) AS communication_change_avg,
  ROUND(AVG(n.conflict_harassment_risk)::NUMERIC, 2) AS conflict_harassment_avg,
  ROUND(AVG(n.recovery_boundaries_risk)::NUMERIC, 2) AS recovery_boundaries_avg,
  COUNT(n.id) AS assessments_count,
  COUNT(CASE WHEN n.overall_risk_level = 'high' THEN 1 END) AS high_risk_count
FROM nr1_risk_assessments n
LEFT JOIN teams t ON n.team_id = t.id
WHERE n.assessment_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY n.org_id, n.team_id, t.name;

COMMENT ON VIEW v_nr1_heatmap IS 'Heatmap de riscos NR-1 por dimensão e equipe (últimos 90 dias)';

-- View: COPC Summary (performance operacional agregada)
CREATE OR REPLACE VIEW v_copc_summary AS
SELECT 
  c.org_id,
  c.team_id,
  t.name AS team_name,
  c.metric_date,
  ROUND(AVG(c.quality_score), 2) AS avg_quality,
  ROUND(AVG(c.process_adherence_rate), 2) AS avg_efficiency,
  ROUND(AVG(c.first_call_resolution_rate), 2) AS avg_effectiveness,
  ROUND(AVG(c.customer_satisfaction_score), 2) AS avg_cx,
  ROUND(AVG(c.absenteeism_rate), 2) AS avg_absenteeism,
  ROUND(AVG(c.overall_performance_score), 2) AS avg_copc_score,
  COUNT(c.id) AS metrics_count
FROM copc_metrics c
LEFT JOIN teams t ON c.team_id = t.id
GROUP BY c.org_id, c.team_id, t.name, c.metric_date;

COMMENT ON VIEW v_copc_summary IS 'Summary de métricas COPC por equipe e data';

-- =====================================================================
-- 12. TRIGGERS (atualização automática de updated_at)
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS php_activations_updated_at ON php_module_activations;
CREATE TRIGGER php_activations_updated_at BEFORE UPDATE ON php_module_activations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS teams_updated_at ON teams;
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tfci_cycles_updated_at ON tfci_cycles;
CREATE TRIGGER tfci_cycles_updated_at BEFORE UPDATE ON tfci_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS nr1_assessments_updated_at ON nr1_risk_assessments;
CREATE TRIGGER nr1_assessments_updated_at BEFORE UPDATE ON nr1_risk_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS copc_catalog_updated_at ON copc_metrics_catalog;
CREATE TRIGGER copc_catalog_updated_at BEFORE UPDATE ON copc_metrics_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS php_action_plans_updated_at ON php_action_plans;
CREATE TRIGGER php_action_plans_updated_at BEFORE UPDATE ON php_action_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS php_action_items_updated_at ON php_action_items;
CREATE TRIGGER php_action_items_updated_at BEFORE UPDATE ON php_action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- 13. VALIDAÇÃO DA MIGRATION
-- =====================================================================

DO $$
DECLARE
  table_count INT;
  enum_count INT;
  policy_count INT;
  view_count INT;
BEGIN
  -- Validar criação de tabelas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'php_module_activations',
    'teams',
    'team_members',
    'nr1_dimensions',
    'tfci_cycles',
    'tfci_assessments',
    'nr1_risk_assessments',
    'copc_metrics_catalog',
    'copc_metrics',
    'php_integrated_scores',
    'php_action_plans',
    'php_action_items'
  );
  
  IF table_count != 12 THEN
    RAISE EXCEPTION 'Erro: Esperado 12 tabelas, encontrado %', table_count;
  END IF;
  
  -- Validar criação de enums
  SELECT COUNT(*) INTO enum_count
  FROM pg_type
  WHERE typname IN (
    'risk_level',
    'assessment_status',
    'metric_source',
    'alert_level',
    'action_plan_status',
    'copc_category'
  );
  
  IF enum_count != 6 THEN
    RAISE EXCEPTION 'Erro: Esperado 6 enums, encontrado %', enum_count;
  END IF;
  
  -- Validar criação de policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename LIKE 'php_%' OR tablename IN ('teams', 'team_members', 'nr1_dimensions', 'tfci_cycles', 'tfci_assessments', 'nr1_risk_assessments', 'copc_metrics_catalog', 'copc_metrics');
  
  IF policy_count < 20 THEN
    RAISE WARNING 'Aviso: Esperado 20+ policies, encontrado %', policy_count;
  END IF;
  
  -- Validar criação de views
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name IN ('v_php_dashboard', 'v_nr1_heatmap', 'v_copc_summary');
  
  IF view_count != 3 THEN
    RAISE EXCEPTION 'Erro: Esperado 3 views, encontrado %', view_count;
  END IF;
  
  -- Validar seed de dimensões NR-1
  IF (SELECT COUNT(*) FROM nr1_dimensions) != 10 THEN
    RAISE EXCEPTION 'Erro: Esperado 10 dimensões NR-1, encontrado %', (SELECT COUNT(*) FROM nr1_dimensions);
  END IF;
  
  -- Validar seed de métricas COPC
  IF (SELECT COUNT(*) FROM copc_metrics_catalog WHERE org_id IS NULL) < 10 THEN
    RAISE EXCEPTION 'Erro: Esperado 10+ métricas COPC template, encontrado %', (SELECT COUNT(*) FROM copc_metrics_catalog WHERE org_id IS NULL);
  END IF;
  
  RAISE NOTICE '✅ Migration 20260130_create_php_module_tables concluída com sucesso!';
  RAISE NOTICE '   - 12 tabelas criadas';
  RAISE NOTICE '   - 6 enums criados';
  RAISE NOTICE '   - % RLS policies aplicadas', policy_count;
  RAISE NOTICE '   - 3 views criadas';
  RAISE NOTICE '   - 10 dimensões NR-1 seedadas';
  RAISE NOTICE '   - % métricas COPC template seedadas', (SELECT COUNT(*) FROM copc_metrics_catalog WHERE org_id IS NULL);
END;
$$;
