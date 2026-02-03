-- Migration: Enterprise Hierarchy Framework (Compacto e Otimizado)
-- Data: 2026-01-31
-- Descrição: Implementa hierarquia N1-N11, reportes múltiplos, span of control, carreira em Y
-- Baseado em: talent_forge_framework_unificado.json
-- Princípio: COMPACTAÇÃO - usa JSONB para dados flexíveis + reaproveita employees existente

-- ========================================
-- 1. ADICIONAR COLUNAS À TABELA EMPLOYEES (COMPACTO)
-- ========================================
-- Evita criar tabelas separadas, usa JSONB para flexibilidade

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS hierarchy_level TEXT CHECK (hierarchy_level IN (
  'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11'
)),
ADD COLUMN IF NOT EXISTS seniority_level TEXT, -- 'Júnior', 'Pleno', 'Sênior', 'I', 'II', 'III'
ADD COLUMN IF NOT EXISTS career_track TEXT CHECK (career_track IN ('gestao', 'tecnica')),
ADD COLUMN IF NOT EXISTS hierarchy_data JSONB DEFAULT '{}'; -- Dados flexíveis (span of control, etc)

-- Índices estratégicos (apenas onde há filtros frequentes)
CREATE INDEX IF NOT EXISTS idx_employees_hierarchy_level ON employees(hierarchy_level) WHERE hierarchy_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_career_track ON employees(career_track) WHERE career_track IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_hierarchy_data ON employees USING gin(hierarchy_data);

COMMENT ON COLUMN employees.hierarchy_level IS 'Nível hierárquico (N1=Conselho até N11=Aprendiz). Fonte: talent_forge_framework_unificado.json';
COMMENT ON COLUMN employees.seniority_level IS 'Senioridade interna (Júnior/Pleno/Sênior para Analista/Gerente, I/II/III para Especialista)';
COMMENT ON COLUMN employees.career_track IS 'Trilha de carreira: gestao (liderança) ou tecnica (especialização)';
COMMENT ON COLUMN employees.hierarchy_data IS 'Dados flexíveis: {subordinates_count, span_control_status, promotion_eligible, last_promotion_date}';

-- ========================================
-- 2. CRIAR TABELA DE REPORTES MÚLTIPLOS (COMPACTA)
-- ========================================
-- Um funcionário pode ter múltiplos gestores (hierárquico + funcional + matricial)

CREATE TYPE report_type AS ENUM ('hierarquico', 'funcional', 'matricial');

CREATE TABLE IF NOT EXISTS employee_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  report_type report_type NOT NULL DEFAULT 'hierarquico',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE, -- Apenas 1 reporte hierárquico pode ser primário
  metadata JSONB DEFAULT '{}', -- {start_date, end_date, project_name (se matricial)}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_report CHECK (employee_id != manager_id)
);

-- Índice único parcial: apenas 1 reporte hierárquico primário por funcionário
CREATE UNIQUE INDEX idx_one_primary_hierarchical_report 
ON employee_reports (employee_id) 
WHERE (report_type = 'hierarquico' AND is_primary = TRUE);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employee_reports_employee ON employee_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_reports_manager ON employee_reports(manager_id);
CREATE INDEX IF NOT EXISTS idx_employee_reports_type ON employee_reports(report_type);

-- RLS para employee_reports
ALTER TABLE employee_reports ENABLE ROW LEVEL SECURITY;

-- Políticas (reutiliza lógica de employees)
CREATE POLICY "admin_full_access_employee_reports"
ON employee_reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
);

CREATE POLICY "member_read_own_employee_reports"
ON employee_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_reports.employee_id 
      AND is_org_member(e.organization_id)
  )
);

CREATE POLICY "member_manage_employee_reports"
ON employee_reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_reports.employee_id 
      AND is_org_member(e.organization_id)
  )
);

COMMENT ON TABLE employee_reports IS 'Reportes múltiplos: hierárquico (autoridade formal), funcional (orientação técnica), matricial (projetos)';

-- ========================================
-- 3. SEED DADOS DO FRAMEWORK (JSONB COMPACTO)
-- ========================================
-- Armazena regras do framework em UMA ÚNICA tabela de configuração

CREATE TABLE IF NOT EXISTS hierarchy_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL UNIQUE CHECK (config_type IN (
    'hierarchy_levels', 'span_of_control', 'seniority_levels', 
    'career_paths', 'governance_rules'
  )),
  config_data JSONB NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para hierarchy_config (somente leitura para membros, escrita para admins)
ALTER TABLE hierarchy_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_read_hierarchy_config"
ON hierarchy_config FOR SELECT
USING (true); -- Configurações são públicas para leitura

CREATE POLICY "admin_manage_hierarchy_config"
ON hierarchy_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'user_type' = 'admin')
  )
);

-- Seed: Níveis hierárquicos (N1-N11)
INSERT INTO hierarchy_config (config_type, config_data) VALUES (
  'hierarchy_levels',
  '[
    {"nivel": "N1", "nome": "Conselho de Administração", "order": 1},
    {"nivel": "N2", "nome": "CEO / Presidente", "order": 2},
    {"nivel": "N3", "nome": "C-Level", "order": 3},
    {"nivel": "N4", "nome": "Diretor", "order": 4},
    {"nivel": "N5", "nome": "Gerente", "order": 5},
    {"nivel": "N6", "nome": "Coordenador / Supervisor", "order": 6},
    {"nivel": "N7", "nome": "Especialista", "order": 7},
    {"nivel": "N8", "nome": "Analista", "order": 8},
    {"nivel": "N9", "nome": "Técnico / Operador", "order": 9},
    {"nivel": "N10", "nome": "Assistente / Auxiliar", "order": 10},
    {"nivel": "N11", "nome": "Estagiário / Aprendiz", "order": 11}
  ]'::jsonb
) ON CONFLICT (config_type) DO NOTHING;

-- Seed: Span of Control (regras operacionais)
INSERT INTO hierarchy_config (config_type, config_data) VALUES (
  'span_of_control',
  '[
    {"nivel": "N4", "cargo": "Diretor", "min": 4, "max": 8},
    {"nivel": "N5", "cargo": "Gerente", "min": 5, "max": 10},
    {"nivel": "N6", "cargo": "Coordenador / Supervisor", "min": 6, "max": 15},
    {"nivel": "N7", "cargo": "Especialista", "min": 0, "max": 6},
    {"nivel": "N8", "cargo": "Analista", "min": 0, "max": 2}
  ]'::jsonb
) ON CONFLICT (config_type) DO NOTHING;

-- Seed: Senioridade por cargo
INSERT INTO hierarchy_config (config_type, config_data) VALUES (
  'seniority_levels',
  '[
    {"cargo": "Analista", "niveis": ["Júnior", "Pleno", "Sênior"]},
    {"cargo": "Especialista", "niveis": ["I", "II", "III"]},
    {"cargo": "Gerente", "niveis": ["Júnior", "Pleno", "Sênior"]}
  ]'::jsonb
) ON CONFLICT (config_type) DO NOTHING;

-- Seed: Carreira em Y (trilhas de progressão)
INSERT INTO hierarchy_config (config_type, config_data) VALUES (
  'career_paths',
  '[
    {"origem": "Analista Sênior", "destino": "Especialista I", "trilha": "tecnica"},
    {"origem": "Analista Sênior", "destino": "Coordenador", "trilha": "gestao"},
    {"origem": "Especialista III", "destino": "Arquiteto / Principal", "trilha": "tecnica"},
    {"origem": "Especialista III", "destino": "Gerente", "trilha": "gestao"}
  ]'::jsonb
) ON CONFLICT (config_type) DO NOTHING;

-- Seed: Regras de governança
INSERT INTO hierarchy_config (config_type, config_data) VALUES (
  'governance_rules',
  '[
    "Somente reporte hierárquico avalia desempenho",
    "Especialistas possuem autoridade técnica, não administrativa",
    "Promoções seguem trilha (gestão ou técnica)",
    "Span of control deve ser respeitado para criação de novos níveis"
  ]'::jsonb
) ON CONFLICT (config_type) DO NOTHING;

COMMENT ON TABLE hierarchy_config IS 'Configuração centralizada do framework de hierarquia. Evita múltiplas tabelas, usa JSONB para flexibilidade.';

-- ========================================
-- 4. FUNÇÃO DE VALIDAÇÃO DE SPAN OF CONTROL
-- ========================================
-- Valida se gestor pode receber mais subordinados com base no nível hierárquico

CREATE OR REPLACE FUNCTION validate_span_of_control()
RETURNS TRIGGER AS $$
DECLARE
  manager_level TEXT;
  subordinate_count INT;
  span_rules JSONB;
  max_span INT;
  manager_org_id UUID;
BEGIN
  -- Apenas validar reportes hierárquicos
  IF NEW.report_type != 'hierarquico' THEN
    RETURN NEW;
  END IF;

  -- Buscar nível e org do gestor
  SELECT e.hierarchy_level, e.organization_id
  INTO manager_level, manager_org_id
  FROM employees e
  WHERE e.id = NEW.manager_id;

  -- Se gestor não tem nível hierárquico definido, permitir
  IF manager_level IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar regras de span of control
  SELECT config_data INTO span_rules
  FROM hierarchy_config
  WHERE config_type = 'span_of_control';

  -- Extrair max span para o nível do gestor
  SELECT (rule->>'max')::int INTO max_span
  FROM jsonb_array_elements(span_rules) AS rule
  WHERE rule->>'nivel' = manager_level;

  -- Se não há regra definida, permitir
  IF max_span IS NULL THEN
    RETURN NEW;
  END IF;

  -- Contar subordinados diretos hierárquicos
  SELECT COUNT(*)
  INTO subordinate_count
  FROM employee_reports
  WHERE manager_id = NEW.manager_id 
    AND report_type = 'hierarquico';

  -- Validar limite
  IF subordinate_count >= max_span THEN
    RAISE EXCEPTION 'Span of control excedido: gestor % (nível %) já possui % subordinados (máx: %)',
      NEW.manager_id, manager_level, subordinate_count, max_span;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar antes de inserir reporte
CREATE TRIGGER check_span_of_control
BEFORE INSERT ON employee_reports
FOR EACH ROW
EXECUTE FUNCTION validate_span_of_control();

COMMENT ON FUNCTION validate_span_of_control() IS 'Valida se gestor pode receber mais subordinados diretos com base no span of control definido no framework';

-- ========================================
-- 5. FUNÇÕES AUXILIARES (API-FRIENDLY)
-- ========================================

-- Função: Obter subordinados diretos de um gestor
CREATE OR REPLACE FUNCTION get_direct_reports(p_manager_id UUID, p_report_type report_type DEFAULT 'hierarquico')
RETURNS TABLE (
  employee_id UUID,
  full_name TEXT,
  employee_position TEXT,
  hierarchy_level TEXT,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.full_name,
    e.position,
    e.hierarchy_level,
    er.is_primary
  FROM employees e
  INNER JOIN employee_reports er ON e.id = er.employee_id
  WHERE er.manager_id = p_manager_id
    AND er.report_type = p_report_type
  ORDER BY er.is_primary DESC, e.full_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Função: Obter toda a árvore hierárquica de uma organização
CREATE OR REPLACE FUNCTION get_org_hierarchy(p_org_id UUID)
RETURNS TABLE (
  employee_id UUID,
  full_name TEXT,
  employee_position TEXT,
  hierarchy_level TEXT,
  manager_id UUID,
  manager_name TEXT,
  depth INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE hierarchy_tree AS (
    -- Base: funcionários sem gestor (topo da hierarquia)
    SELECT 
      e.id AS employee_id,
      e.full_name,
      e.position AS employee_position,
      e.hierarchy_level,
      NULL::UUID AS manager_id,
      NULL::TEXT AS manager_name,
      0 AS depth
    FROM employees e
    WHERE e.organization_id = p_org_id
      AND NOT EXISTS (
        SELECT 1 FROM employee_reports er 
        WHERE er.employee_id = e.id 
          AND er.report_type = 'hierarquico' 
          AND er.is_primary = TRUE
      )
    
    UNION ALL
    
    -- Recursivo: subordinados
    SELECT 
      e.id,
      e.full_name,
      e.position,
      e.hierarchy_level,
      er.manager_id,
      m.full_name,
      ht.depth + 1
    FROM employees e
    INNER JOIN employee_reports er ON e.id = er.employee_id
    INNER JOIN employees m ON er.manager_id = m.id
    INNER JOIN hierarchy_tree ht ON er.manager_id = ht.employee_id
    WHERE er.report_type = 'hierarquico'
      AND er.is_primary = TRUE
      AND e.organization_id = p_org_id
  )
  SELECT * FROM hierarchy_tree
  ORDER BY depth, full_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_direct_reports(UUID, report_type) IS 'Retorna subordinados diretos de um gestor (filtrado por tipo de reporte)';
COMMENT ON FUNCTION get_org_hierarchy(UUID) IS 'Retorna árvore hierárquica completa de uma organização (recursive CTE)';

-- ========================================
-- 6. MIGRAR MANAGER_ID EXISTENTE PARA EMPLOYEE_REPORTS
-- ========================================
-- Preserva relacionamentos hierárquicos já existentes

INSERT INTO employee_reports (employee_id, manager_id, report_type, is_primary, metadata)
SELECT 
  id, 
  manager_id, 
  'hierarquico'::report_type, 
  TRUE,
  jsonb_build_object('migrated_at', NOW(), 'source', 'manager_id_column')
FROM employees
WHERE manager_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Não removemos manager_id ainda (manter compatibilidade temporária)
-- Sprint futura: ALTER TABLE employees DROP COLUMN manager_id;

-- ========================================
-- 7. VALIDAÇÃO E TESTES
-- ========================================

DO $$
DECLARE
  config_count INT;
  levels_data JSONB;
BEGIN
  -- Verificar que todas as configurações foram criadas
  SELECT COUNT(*) INTO config_count
  FROM hierarchy_config
  WHERE config_type IN ('hierarchy_levels', 'span_of_control', 'seniority_levels', 'career_paths', 'governance_rules');

  IF config_count != 5 THEN
    RAISE EXCEPTION 'Configurações de hierarquia incompletas: esperado 5, encontrado %', config_count;
  END IF;

  -- Testar consulta de níveis hierárquicos
  SELECT config_data INTO levels_data
  FROM hierarchy_config
  WHERE config_type = 'hierarchy_levels';

  IF jsonb_array_length(levels_data) != 11 THEN
    RAISE EXCEPTION 'Níveis hierárquicos incorretos: esperado 11, encontrado %', jsonb_array_length(levels_data);
  END IF;

  RAISE NOTICE '✅ Migration 20260131_hierarchy_framework aplicada com sucesso';
  RAISE NOTICE '   • Colunas adicionadas: hierarchy_level, seniority_level, career_track, hierarchy_data';
  RAISE NOTICE '   • Tabelas criadas: employee_reports, hierarchy_config';
  RAISE NOTICE '   • Funções criadas: validate_span_of_control, get_direct_reports, get_org_hierarchy';
  RAISE NOTICE '   • Dados migrados: % reportes hierárquicos', (SELECT COUNT(*) FROM employee_reports);
END $$;
