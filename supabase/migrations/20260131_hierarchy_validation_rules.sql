-- Migration: Validação de Hierarquia + Helper Functions
-- Data: 2026-01-31
-- Descrição: Adiciona validações para evitar hierarquia invertida + funções para UI

-- ========================================
-- 1. FUNÇÃO: LISTAR GESTORES VÁLIDOS POR NÍVEL
-- ========================================
-- Retorna apenas gestores de nível SUPERIOR ao cargo sendo cadastrado

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
  -- Buscar ordem do nível do funcionário
  SELECT (nivel->>'order')::int INTO v_level_order
  FROM hierarchy_config, jsonb_array_elements(config_data) AS nivel
  WHERE config_type = 'hierarchy_levels' 
    AND nivel->>'nivel' = p_employee_level;

  -- N1 (Conselho) não tem gestor
  IF p_employee_level = 'N1' THEN
    RETURN;
  END IF;

  -- Retornar apenas funcionários de nível SUPERIOR (ordem menor)
  RETURN QUERY
  SELECT 
    e.id,
    e.full_name,
    e.position,
    e.hierarchy_level,
    e.department
  FROM employees e
  CROSS JOIN hierarchy_config hc,
             jsonb_array_elements(hc.config_data) AS nivel
  WHERE e.organization_id = p_organization_id
    AND e.status = 'active'
    AND e.hierarchy_level IS NOT NULL
    AND hc.config_type = 'hierarchy_levels'
    AND nivel->>'nivel' = e.hierarchy_level
    AND (nivel->>'order')::int < v_level_order  -- Apenas níveis superiores
  ORDER BY (nivel->>'order')::int, e.full_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_valid_managers(TEXT, UUID) IS 
'Retorna gestores válidos (nível superior) para um cargo. N1 retorna vazio (sem gestor).';

-- ========================================
-- 2. FUNÇÃO: LISTAR DEPARTAMENTOS POR CARGO
-- ========================================
-- Mapeia cargos para departamentos típicos

CREATE OR REPLACE FUNCTION get_departments_by_position(p_hierarchy_level TEXT)
RETURNS TABLE (department TEXT) AS $$
BEGIN
  -- N1-N3: Estratégico
  IF p_hierarchy_level IN ('N1', 'N2', 'N3') THEN
    RETURN QUERY
    SELECT unnest(ARRAY[
      'Conselho', 'Presidência', 'Diretoria Executiva'
    ]::TEXT[]) ORDER BY 1;
    RETURN;
  END IF;

  -- N4-N5: Direção/Gerência
  IF p_hierarchy_level IN ('N4', 'N5') THEN
    RETURN QUERY
    SELECT unnest(ARRAY[
      'Administrativo', 'Financeiro', 'Recursos Humanos', 'Tecnologia',
      'Comercial', 'Marketing', 'Operações', 'Jurídico', 'Compliance'
    ]::TEXT[]) ORDER BY 1;
    RETURN;
  END IF;

  -- N6-N8: Coordenação/Especialistas/Analistas
  IF p_hierarchy_level IN ('N6', 'N7', 'N8') THEN
    RETURN QUERY
    SELECT unnest(ARRAY[
      'Administrativo', 'Financeiro', 'Recursos Humanos', 'Tecnologia',
      'Comercial', 'Marketing', 'Operações', 'Atendimento', 'Suporte',
      'Qualidade', 'Logística', 'Compras', 'Produto'
    ]::TEXT[]) ORDER BY 1;
    RETURN;
  END IF;

  -- N9-N11: Operacional
  RETURN QUERY
  SELECT unnest(ARRAY[
    'Operações', 'Atendimento', 'Suporte', 'Logística', 
    'Produção', 'Manutenção', 'Administrativo'
  ]::TEXT[]) ORDER BY 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_departments_by_position(TEXT) IS 
'Retorna departamentos apropriados para cada nível hierárquico';

-- ========================================
-- 3. CONSTRAINT: VALIDAR HIERARQUIA NÃO INVERTIDA
-- ========================================
-- Impede que gestor seja de nível inferior ao subordinado

CREATE OR REPLACE FUNCTION validate_manager_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_level TEXT;
  v_manager_level TEXT;
  v_employee_order INT;
  v_manager_order INT;
BEGIN
  -- Apenas validar reportes hierárquicos
  IF NEW.report_type != 'hierarquico' THEN
    RETURN NEW;
  END IF;

  -- Buscar níveis
  SELECT hierarchy_level INTO v_employee_level
  FROM employees WHERE id = NEW.employee_id;

  SELECT hierarchy_level INTO v_manager_level
  FROM employees WHERE id = NEW.manager_id;

  -- Se não têm níveis definidos, permitir
  IF v_employee_level IS NULL OR v_manager_level IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar ordem dos níveis
  SELECT (nivel->>'order')::int INTO v_employee_order
  FROM hierarchy_config, jsonb_array_elements(config_data) AS nivel
  WHERE config_type = 'hierarchy_levels' AND nivel->>'nivel' = v_employee_level;

  SELECT (nivel->>'order')::int INTO v_manager_order
  FROM hierarchy_config, jsonb_array_elements(config_data) AS nivel
  WHERE config_type = 'hierarchy_levels' AND nivel->>'nivel' = v_manager_level;

  -- Validar: gestor deve ser de nível SUPERIOR (ordem menor)
  IF v_manager_order >= v_employee_order THEN
    RAISE EXCEPTION 
      'Hierarquia invertida: gestor % (nível %, ordem %) não pode gerenciar funcionário % (nível %, ordem %). Gestor deve ser de nível superior.',
      NEW.manager_id, v_manager_level, v_manager_order,
      NEW.employee_id, v_employee_level, v_employee_order;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger
DROP TRIGGER IF EXISTS validate_manager_hierarchy ON employee_reports;
CREATE TRIGGER validate_manager_hierarchy
  BEFORE INSERT OR UPDATE ON employee_reports
  FOR EACH ROW
  EXECUTE FUNCTION validate_manager_hierarchy();

COMMENT ON FUNCTION validate_manager_hierarchy() IS 
'Valida que gestor tem nível hierárquico SUPERIOR ao subordinado (ordem menor)';

-- ========================================
-- 4. VIEW: EMPLOYEES COM DADOS HIERÁRQUICOS
-- ========================================
-- View facilitada para o frontend consumir

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
  
  -- Dados do nível hierárquico
  (SELECT nivel->>'nome' 
   FROM hierarchy_config, jsonb_array_elements(config_data) AS nivel
   WHERE config_type = 'hierarchy_levels' AND nivel->>'nivel' = e.hierarchy_level
  ) AS hierarchy_level_name,
  
  (SELECT (nivel->>'order')::int
   FROM hierarchy_config, jsonb_array_elements(config_data) AS nivel
   WHERE config_type = 'hierarchy_levels' AND nivel->>'nivel' = e.hierarchy_level
  ) AS hierarchy_order,
  
  -- Gestor direto (se houver)
  (SELECT m.id FROM employees m 
   INNER JOIN employee_reports er ON m.id = er.manager_id
   WHERE er.employee_id = e.id 
     AND er.report_type = 'hierarquico' 
     AND er.is_primary = TRUE
   LIMIT 1
  ) AS manager_id,
  
  (SELECT m.full_name FROM employees m 
   INNER JOIN employee_reports er ON m.id = er.manager_id
   WHERE er.employee_id = e.id 
     AND er.report_type = 'hierarquico' 
     AND er.is_primary = TRUE
   LIMIT 1
  ) AS manager_name,
  
  -- Contagem de subordinados
  (SELECT COUNT(*) FROM employee_reports er
   WHERE er.manager_id = e.id AND er.report_type = 'hierarquico'
  ) AS subordinates_count,
  
  e.created_at,
  e.updated_at
FROM employees e;

COMMENT ON VIEW v_employees_hierarchy IS 
'View enriquecida de employees com dados hierárquicos pré-calculados';

-- ========================================
-- 5. VALIDAÇÃO
-- ========================================

DO $$
BEGIN
  -- Verificar funções criadas
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_valid_managers') THEN
    RAISE EXCEPTION 'Função get_valid_managers não criada';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_departments_by_position') THEN
    RAISE EXCEPTION 'Função get_departments_by_position não criada';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_manager_hierarchy') THEN
    RAISE EXCEPTION 'Função validate_manager_hierarchy não criada';
  END IF;

  -- Verificar trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_manager_hierarchy'
  ) THEN
    RAISE EXCEPTION 'Trigger validate_manager_hierarchy não criado';
  END IF;

  -- Verificar view
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views WHERE table_name = 'v_employees_hierarchy'
  ) THEN
    RAISE EXCEPTION 'View v_employees_hierarchy não criada';
  END IF;

  RAISE NOTICE '✅ Migration 20260131_hierarchy_validation_rules aplicada com sucesso';
  RAISE NOTICE '   • Função: get_valid_managers (lista gestores válidos por nível)';
  RAISE NOTICE '   • Função: get_departments_by_position (departamentos por cargo)';
  RAISE NOTICE '   • Trigger: validate_manager_hierarchy (valida hierarquia)';
  RAISE NOTICE '   • View: v_employees_hierarchy (dados enriquecidos)';
END $$;
