-- Migration: Validação de Hierarquia + Helper Functions v2
-- Data: 2026-01-31
-- Descrição: Versão SIMPLIFICADA - usa JSONB do hierarchy_config existente

-- ========================================
-- LIMPAR FUNÇÕES ANTIGAS (se existirem)
-- ========================================
-- IMPORTANTE: Dropar TRIGGER primeiro, depois a FUNÇÃO
DROP TRIGGER IF EXISTS validate_manager_hierarchy ON employee_reports;
DROP FUNCTION IF EXISTS get_valid_managers(TEXT, UUID);
DROP FUNCTION IF EXISTS get_departments_by_position(TEXT);
DROP FUNCTION IF EXISTS validate_manager_hierarchy();

-- ========================================
-- 1. FUNÇÃO: LISTAR GESTORES VÁLIDOS POR NÍVEL
-- ========================================
CREATE OR REPLACE FUNCTION get_valid_managers(
  p_employee_level TEXT,
  p_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  employee_position TEXT,
  hierarchy_level TEXT,
  department TEXT
) AS $$
DECLARE
  v_level_order INT;
BEGIN
  -- N1 não tem gestor
  IF p_employee_level = 'N1' THEN
    RETURN;
  END IF;

  -- Buscar ordem do nível do funcionário
  SELECT (nivel->>'order')::int INTO v_level_order
  FROM hierarchy_config, jsonb_array_elements(config_data) AS nivel
  WHERE config_type = 'hierarchy_levels' 
    AND nivel->>'nivel' = p_employee_level;

  -- Retornar funcionários de nível SUPERIOR (ordem < atual)
  RETURN QUERY
  SELECT 
    e.id,
    e.full_name,
    e.position AS employee_position,
    e.hierarchy_level,
    e.department
  FROM employees e
  WHERE e.organization_id = p_organization_id
    AND e.status = 'active'
    AND e.hierarchy_level IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM hierarchy_config hc, jsonb_array_elements(hc.config_data) AS nivel
      WHERE hc.config_type = 'hierarchy_levels'
        AND nivel->>'nivel' = e.hierarchy_level
        AND (nivel->>'order')::int < v_level_order
    )
  ORDER BY e.hierarchy_level, e.full_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ========================================
-- 2. DEPARTAMENTOS: Lógica no Frontend
-- ========================================
-- Princípio KISS: departamentos são fixos, não precisa view/função
-- Frontend terá objeto TypeScript com mapeamento nivel -> departamentos

-- ========================================
-- 3. TRIGGER: VALIDAR HIERARQUIA
-- ========================================
CREATE OR REPLACE FUNCTION validate_manager_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_order INT;
  v_manager_order INT;
BEGIN
  -- Apenas reportes hierárquicos
  IF NEW.report_type != 'hierarquico' THEN
    RETURN NEW;
  END IF;

  -- Buscar ordens dos níveis
  SELECT (nivel->>'order')::int INTO v_employee_order
  FROM employees e, hierarchy_config hc, jsonb_array_elements(hc.config_data) AS nivel
  WHERE e.id = NEW.employee_id
    AND hc.config_type = 'hierarchy_levels'
    AND nivel->>'nivel' = e.hierarchy_level;

  SELECT (nivel->>'order')::int INTO v_manager_order
  FROM employees e, hierarchy_config hc, jsonb_array_elements(hc.config_data) AS nivel
  WHERE e.id = NEW.manager_id
    AND hc.config_type = 'hierarchy_levels'
    AND nivel->>'nivel' = e.hierarchy_level;

  -- Validar
  IF v_employee_order IS NOT NULL AND v_manager_order IS NOT NULL THEN
    IF v_manager_order >= v_employee_order THEN
      RAISE EXCEPTION 'Hierarquia invertida: gestor (ordem %) não pode gerenciar funcionário (ordem %)', 
        v_manager_order, v_employee_order;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_manager_hierarchy
  BEFORE INSERT OR UPDATE ON employee_reports
  FOR EACH ROW
  EXECUTE FUNCTION validate_manager_hierarchy();

-- ========================================
-- 4. VIEW: EMPLOYEES ENRIQUECIDA
-- ========================================
CREATE OR REPLACE VIEW v_employees_hierarchy AS
SELECT 
  e.id,
  e.organization_id,
  e.full_name,
  e.cpf,
  e.position,
  e.department,
  e.hierarchy_level,
  e.seniority_level,
  e.career_track,
  e.email,
  e.phone,
  e.hire_date,
  e.status,
  nivel->>'nome' AS hierarchy_level_name,
  (nivel->>'order')::int AS hierarchy_order,
  (SELECT m.id FROM employees m 
   INNER JOIN employee_reports er ON m.id = er.manager_id
   WHERE er.employee_id = e.id AND er.report_type = 'hierarquico' AND er.is_primary = TRUE
   LIMIT 1) AS manager_id,
  (SELECT m.full_name FROM employees m 
   INNER JOIN employee_reports er ON m.id = er.manager_id
   WHERE er.employee_id = e.id AND er.report_type = 'hierarquico' AND er.is_primary = TRUE
   LIMIT 1) AS manager_name,
  (SELECT COUNT(*) FROM employee_reports er
   WHERE er.manager_id = e.id AND er.report_type = 'hierarquico') AS subordinates_count,
  e.created_at,
  e.updated_at
FROM employees e
LEFT JOIN hierarchy_config hc ON hc.config_type = 'hierarchy_levels'
LEFT JOIN jsonb_array_elements(hc.config_data) AS nivel ON nivel->>'nivel' = e.hierarchy_level;

-- ========================================
-- 5. VALIDAÇÃO
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260131_hierarchy_validation_rules_v2 aplicada';
  RAISE NOTICE '   • Função: get_valid_managers (filtra gestores por nível)';
  RAISE NOTICE '   • Trigger: validate_manager_hierarchy (impede hierarquia invertida)';
  RAISE NOTICE '   • View: v_employees_hierarchy (dados enriquecidos)';
  RAISE NOTICE '   • Departamentos: lógica no frontend (KISS)';
END $$;
