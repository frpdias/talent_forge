-- Sprint 25: COPC Catálogo Dinâmico — KPIs flexíveis por área
-- Problema: copc_metrics tem colunas fixas de call center (AHT, FCR, etc.)
-- Solução: copc_metric_entries (chave-valor) ligada ao catálogo customizável
-- Agora cada área (Vendas, Produção, Atendimento) define seus próprios KPIs

-- =====================================================================
-- 1. Expandir copc_metrics_catalog com campos de área/departamento
-- =====================================================================

ALTER TABLE copc_metrics_catalog
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS min_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_value NUMERIC(10,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS higher_is_better BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN copc_metrics_catalog.department IS 'Departamento/área que usa este KPI (NULL = todas as áreas)';
COMMENT ON COLUMN copc_metrics_catalog.higher_is_better IS 'Se TRUE, valor mais alto é melhor (ex: CSAT). Se FALSE, mais baixo é melhor (ex: absenteísmo)';

-- =====================================================================
-- 2. Nova tabela: copc_metric_entries (dados flexíveis chave-valor)
-- =====================================================================

CREATE TABLE IF NOT EXISTS copc_metric_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  catalog_metric_id UUID REFERENCES copc_metrics_catalog(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department TEXT,
  metric_date DATE DEFAULT CURRENT_DATE NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'api_integration', 'calculated')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_copc_entries_org ON copc_metric_entries(org_id);
CREATE INDEX idx_copc_entries_catalog ON copc_metric_entries(catalog_metric_id);
CREATE INDEX idx_copc_entries_dept ON copc_metric_entries(org_id, department);
CREATE INDEX idx_copc_entries_date ON copc_metric_entries(org_id, metric_date DESC);
CREATE INDEX idx_copc_entries_team ON copc_metric_entries(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_copc_entries_user ON copc_metric_entries(user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE copc_metric_entries IS 'Registros de KPIs flexíveis — cada linha é um valor para um KPI do catálogo';

-- =====================================================================
-- 3. RLS
-- =====================================================================

ALTER TABLE copc_metric_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY copc_entries_select ON copc_metric_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = copc_metric_entries.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY copc_entries_insert ON copc_metric_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = copc_metric_entries.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

CREATE POLICY copc_entries_delete ON copc_metric_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = copc_metric_entries.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin')
      AND om.status = 'active'
    )
  );

GRANT SELECT ON copc_metric_entries TO anon, authenticated;
GRANT INSERT, DELETE ON copc_metric_entries TO authenticated;

-- =====================================================================
-- 4. View: Score dinâmico por área (calcula score com pesos do catálogo)
-- =====================================================================

CREATE OR REPLACE VIEW v_copc_dynamic_scores AS
WITH entry_scores AS (
  SELECT
    e.org_id,
    e.department,
    e.team_id,
    e.metric_date,
    c.category,
    c.metric_code,
    c.metric_name,
    c.weight AS metric_weight,
    c.higher_is_better,
    c.min_value,
    c.max_value,
    e.value,
    -- Normalizar para 0-100
    CASE 
      WHEN c.higher_is_better THEN
        LEAST(100, GREATEST(0, 
          ((e.value - COALESCE(c.min_value, 0)) / NULLIF(COALESCE(c.max_value, 100) - COALESCE(c.min_value, 0), 0)) * 100
        ))
      ELSE
        LEAST(100, GREATEST(0, 
          100 - ((e.value - COALESCE(c.min_value, 0)) / NULLIF(COALESCE(c.max_value, 100) - COALESCE(c.min_value, 0), 0)) * 100
        ))
    END AS normalized_score
  FROM copc_metric_entries e
  JOIN copc_metrics_catalog c ON e.catalog_metric_id = c.id
  WHERE c.is_active = TRUE
),
category_scores AS (
  SELECT
    org_id,
    department,
    team_id,
    metric_date,
    category,
    -- Média ponderada dentro da categoria
    SUM(normalized_score * metric_weight) / NULLIF(SUM(metric_weight), 0) AS category_score,
    COUNT(*) AS entries_count
  FROM entry_scores
  GROUP BY org_id, department, team_id, metric_date, category
)
SELECT
  org_id,
  COALESCE(department, 'Geral') AS department,
  team_id,
  metric_date,
  -- Scores por categoria
  MAX(CASE WHEN category = 'quality' THEN ROUND(category_score, 2) END) AS quality_score,
  MAX(CASE WHEN category = 'efficiency' THEN ROUND(category_score, 2) END) AS efficiency_score,
  MAX(CASE WHEN category = 'effectiveness' THEN ROUND(category_score, 2) END) AS effectiveness_score,
  MAX(CASE WHEN category = 'cx' THEN ROUND(category_score, 2) END) AS cx_score,
  MAX(CASE WHEN category = 'people' THEN ROUND(category_score, 2) END) AS people_score,
  -- Score geral ponderado (Quality 35% + Efficiency 20% + Effectiveness 20% + CX 15% + People 10%)
  ROUND(
    COALESCE(MAX(CASE WHEN category = 'quality' THEN category_score END), 0) * 0.35 +
    COALESCE(MAX(CASE WHEN category = 'efficiency' THEN category_score END), 0) * 0.20 +
    COALESCE(MAX(CASE WHEN category = 'effectiveness' THEN category_score END), 0) * 0.20 +
    COALESCE(MAX(CASE WHEN category = 'cx' THEN category_score END), 0) * 0.15 +
    COALESCE(MAX(CASE WHEN category = 'people' THEN category_score END), 0) * 0.10
  , 2) AS overall_score,
  SUM(entries_count) AS total_entries
FROM category_scores
GROUP BY org_id, department, team_id, metric_date;

GRANT SELECT ON v_copc_dynamic_scores TO anon, authenticated;

COMMENT ON VIEW v_copc_dynamic_scores IS 'Score COPC dinâmico calculado a partir do catálogo flexível — funciona para qualquer área';

-- =====================================================================
-- 5. Seeds: Templates de KPIs por área 
-- org_id NULL = templates globais disponíveis para todas as orgs
-- =====================================================================

-- VENDAS
INSERT INTO copc_metrics_catalog (org_id, category, metric_name, metric_code, weight, unit, department, description, min_value, max_value, higher_is_better, target_value, display_order) VALUES
  (NULL, 'quality', 'Taxa de Conversão', 'vendas_conversao', 0.50, '%', 'Vendas', 'Percentual de leads convertidos em vendas', 0, 100, TRUE, 30, 1),
  (NULL, 'quality', 'Quality of Sale', 'vendas_quality_sale', 0.50, '%', 'Vendas', 'Vendas sem cancelamento em 30 dias', 0, 100, TRUE, 90, 2),
  (NULL, 'efficiency', 'Ticket Médio', 'vendas_ticket_medio', 0.60, 'R$', 'Vendas', 'Valor médio por venda', 0, 50000, TRUE, 5000, 3),
  (NULL, 'efficiency', 'Ciclo de Venda', 'vendas_ciclo', 0.40, 'dias', 'Vendas', 'Tempo médio do pipeline até fechamento', 0, 180, FALSE, 30, 4),
  (NULL, 'effectiveness', 'Atingimento de Meta', 'vendas_meta', 0.70, '%', 'Vendas', 'Percentual da meta mensal atingida', 0, 200, TRUE, 100, 5),
  (NULL, 'effectiveness', 'Receita per Capita', 'vendas_receita_pc', 0.30, 'R$', 'Vendas', 'Receita gerada por vendedor', 0, 500000, TRUE, 50000, 6),
  (NULL, 'cx', 'CSAT Pós-Venda', 'vendas_csat', 0.70, '%', 'Vendas', 'Satisfação do cliente após a venda', 0, 100, TRUE, 85, 7),
  (NULL, 'cx', 'NPS Comercial', 'vendas_nps', 0.30, 'score', 'Vendas', 'NPS do processo comercial', -100, 100, TRUE, 50, 8),
  (NULL, 'people', 'Turnover Comercial', 'vendas_turnover', 0.50, '%', 'Vendas', 'Rotatividade da equipe de vendas', 0, 100, FALSE, 5, 9),
  (NULL, 'people', 'Engajamento Vendas', 'vendas_engagement', 0.50, 'score', 'Vendas', 'Nível de engajamento (1-5)', 1, 5, TRUE, 4, 10)
ON CONFLICT (org_id, metric_code) DO NOTHING;

-- PRODUÇÃO
INSERT INTO copc_metrics_catalog (org_id, category, metric_name, metric_code, weight, unit, department, description, min_value, max_value, higher_is_better, target_value, display_order) VALUES
  (NULL, 'quality', 'Taxa de Defeito', 'prod_defeito', 0.50, '%', 'Produção', 'Percentual de unidades defeituosas', 0, 100, FALSE, 2, 1),
  (NULL, 'quality', 'Conformidade de Processo', 'prod_conformidade', 0.50, '%', 'Produção', 'Aderência aos padrões de qualidade', 0, 100, TRUE, 95, 2),
  (NULL, 'efficiency', 'OEE', 'prod_oee', 0.60, '%', 'Produção', 'Overall Equipment Effectiveness', 0, 100, TRUE, 85, 3),
  (NULL, 'efficiency', 'Throughput', 'prod_throughput', 0.40, 'un/h', 'Produção', 'Unidades produzidas por hora', 0, 10000, TRUE, 100, 4),
  (NULL, 'effectiveness', 'Entrega no Prazo', 'prod_on_time', 0.60, '%', 'Produção', 'Percentual de pedidos entregues no prazo', 0, 100, TRUE, 95, 5),
  (NULL, 'effectiveness', 'Lead Time', 'prod_lead_time', 0.40, 'horas', 'Produção', 'Tempo total do pedido até entrega', 0, 720, FALSE, 48, 6),
  (NULL, 'cx', 'Satisfação Interna', 'prod_csat_interno', 0.70, '%', 'Produção', 'Satisfação dos clientes internos', 0, 100, TRUE, 85, 7),
  (NULL, 'cx', 'Reclamações', 'prod_reclamacoes', 0.30, 'qtd', 'Produção', 'Número de reclamações no mês', 0, 100, FALSE, 5, 8),
  (NULL, 'people', 'Absenteísmo', 'prod_absenteeism', 0.50, '%', 'Produção', 'Taxa de faltas', 0, 100, FALSE, 3, 9),
  (NULL, 'people', 'Acidentes de Trabalho', 'prod_acidentes', 0.50, 'qtd', 'Produção', 'Número de acidentes no mês', 0, 50, FALSE, 0, 10)
ON CONFLICT (org_id, metric_code) DO NOTHING;

-- ADMINISTRATIVO
INSERT INTO copc_metrics_catalog (org_id, category, metric_name, metric_code, weight, unit, department, description, min_value, max_value, higher_is_better, target_value, display_order) VALUES
  (NULL, 'quality', 'Precisão de Relatórios', 'adm_precisao', 0.50, '%', 'Administrativo', 'Percentual de relatórios sem erros', 0, 100, TRUE, 98, 1),
  (NULL, 'quality', 'Compliance', 'adm_compliance', 0.50, '%', 'Administrativo', 'Aderência a normas regulatórias', 0, 100, TRUE, 100, 2),
  (NULL, 'efficiency', 'SLA Interno', 'adm_sla', 0.60, '%', 'Administrativo', 'Percentual de demandas atendidas no prazo', 0, 100, TRUE, 90, 3),
  (NULL, 'efficiency', 'Custo por Processo', 'adm_custo', 0.40, 'R$', 'Administrativo', 'Custo médio por processo administrativo', 0, 10000, FALSE, 100, 4),
  (NULL, 'effectiveness', 'Automação', 'adm_automacao', 0.50, '%', 'Administrativo', 'Percentual de processos automatizados', 0, 100, TRUE, 70, 5),
  (NULL, 'effectiveness', 'Tempo de Resposta', 'adm_response_time', 0.50, 'horas', 'Administrativo', 'Tempo médio de resposta a solicitações', 0, 168, FALSE, 4, 6),
  (NULL, 'cx', 'Satisfação Interna', 'adm_csat', 0.70, '%', 'Administrativo', 'Satisfação dos departamentos atendidos', 0, 100, TRUE, 85, 7),
  (NULL, 'cx', 'Feedbacks Positivos', 'adm_feedback', 0.30, '%', 'Administrativo', 'Percentual de feedbacks positivos recebidos', 0, 100, TRUE, 80, 8),
  (NULL, 'people', 'Absenteísmo', 'adm_absenteeism', 0.50, '%', 'Administrativo', 'Taxa de faltas', 0, 100, FALSE, 3, 9),
  (NULL, 'people', 'Desenvolvimento', 'adm_treinamento', 0.50, 'horas', 'Administrativo', 'Horas de treinamento por colaborador/mês', 0, 40, TRUE, 8, 10)
ON CONFLICT (org_id, metric_code) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Sprint 25: copc_metric_entries criada + 30 KPIs templates (Vendas, Produção, Administrativo)';
END $$;
