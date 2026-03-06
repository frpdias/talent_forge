-- NR-1 Self Assessment: Pesquisa de percepção do funcionário
-- Complementa a avaliação organizacional com a visão do próprio funcionário

-- Tabela para respostas de auto-avaliação dos funcionários
CREATE TABLE IF NOT EXISTS nr1_self_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Relacionamento com avaliação organizacional (opcional, pode ser respondida antes)
  organizational_assessment_id UUID REFERENCES nr1_risk_assessments(id) ON DELETE SET NULL,
  
  -- 10 dimensões NR-1 (mesmas da avaliação organizacional)
  -- Escala 1-5: 1=Muito Ruim, 2=Ruim, 3=Regular, 4=Bom, 5=Muito Bom
  workload_pace_risk INTEGER NOT NULL CHECK (workload_pace_risk BETWEEN 1 AND 5),
  goal_pressure_risk INTEGER NOT NULL CHECK (goal_pressure_risk BETWEEN 1 AND 5),
  role_clarity_risk INTEGER NOT NULL CHECK (role_clarity_risk BETWEEN 1 AND 5),
  autonomy_control_risk INTEGER NOT NULL CHECK (autonomy_control_risk BETWEEN 1 AND 5),
  leadership_support_risk INTEGER NOT NULL CHECK (leadership_support_risk BETWEEN 1 AND 5),
  peer_collaboration_risk INTEGER NOT NULL CHECK (peer_collaboration_risk BETWEEN 1 AND 5),
  recognition_justice_risk INTEGER NOT NULL CHECK (recognition_justice_risk BETWEEN 1 AND 5),
  communication_change_risk INTEGER NOT NULL CHECK (communication_change_risk BETWEEN 1 AND 5),
  conflict_harassment_risk INTEGER NOT NULL CHECK (conflict_harassment_risk BETWEEN 1 AND 5),
  recovery_boundaries_risk INTEGER NOT NULL CHECK (recovery_boundaries_risk BETWEEN 1 AND 5),
  
  -- Score calculado (média das 10 dimensões)
  self_score DECIMAL(5,2) NOT NULL,
  
  -- Nível de risco baseado no self-score
  self_risk_level TEXT NOT NULL CHECK (self_risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Comentários abertos do funcionário
  comments TEXT,
  
  -- Status da resposta
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('invited', 'in_progress', 'completed')),
  
  -- Controle
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_nr1_self_assessments_org_id ON nr1_self_assessments(org_id);
CREATE INDEX idx_nr1_self_assessments_employee_id ON nr1_self_assessments(employee_id);
CREATE INDEX idx_nr1_self_assessments_org_assessment ON nr1_self_assessments(organizational_assessment_id);
CREATE INDEX idx_nr1_self_assessments_status ON nr1_self_assessments(status);

-- Constraint: Um funcionário só pode ter uma self-assessment por avaliação organizacional
CREATE UNIQUE INDEX idx_nr1_self_unique_per_org_assessment 
  ON nr1_self_assessments(employee_id, organizational_assessment_id) 
  WHERE organizational_assessment_id IS NOT NULL;

-- Trigger para updated_at
CREATE TRIGGER update_nr1_self_assessments_updated_at
  BEFORE UPDATE ON nr1_self_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE nr1_self_assessments ENABLE ROW LEVEL SECURITY;

-- Funcionário pode ver apenas suas próprias respostas
CREATE POLICY nr1_self_assessments_employee_read ON nr1_self_assessments
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE org_id = (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Funcionário pode criar/atualizar suas próprias respostas
CREATE POLICY nr1_self_assessments_employee_write ON nr1_self_assessments
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE org_id = (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY nr1_self_assessments_employee_update ON nr1_self_assessments
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE org_id = (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- RH/Admin da org pode ver e gerenciar todas as respostas da org
CREATE POLICY nr1_self_assessments_org_full_access ON nr1_self_assessments
  FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

-- View para análise comparativa (Percepção vs Realidade)
CREATE OR REPLACE VIEW v_nr1_comparative_analysis AS
SELECT 
  sa.id as self_assessment_id,
  sa.org_id,
  sa.employee_id,
  e.full_name as employee_name,
  e.position as employee_position,
  
  -- Scores
  sa.self_score,
  sa.self_risk_level,
  -- Score organizacional calculado (média das 10 dimensões, escala 1-3)
  ROUND((oa.workload_pace_risk + oa.goal_pressure_risk + oa.role_clarity_risk +
         oa.autonomy_control_risk + oa.leadership_support_risk + oa.peer_collaboration_risk +
         oa.recognition_justice_risk + oa.communication_change_risk + oa.conflict_harassment_risk +
         oa.recovery_boundaries_risk) / 10.0, 2) as organizational_score,
  oa.overall_risk_level as organizational_risk_level,
  
  -- Gap de percepção (diferença entre auto-avaliação e avaliação organizacional)
  -- Normalizado: self_score (1-5) comparado com org_score (1-3) -> converter para mesma escala
  (sa.self_score - ((oa.workload_pace_risk + oa.goal_pressure_risk + oa.role_clarity_risk +
                     oa.autonomy_control_risk + oa.leadership_support_risk + oa.peer_collaboration_risk +
                     oa.recognition_justice_risk + oa.communication_change_risk + oa.conflict_harassment_risk +
                     oa.recovery_boundaries_risk) / 10.0 * 5.0 / 3.0)) as perception_gap,
  
  -- Dimensões: Self vs Organizational
  json_build_object(
    'workload_pace_risk', json_build_object('self', sa.workload_pace_risk, 'org', oa.workload_pace_risk, 'gap', sa.workload_pace_risk - oa.workload_pace_risk),
    'goal_pressure_risk', json_build_object('self', sa.goal_pressure_risk, 'org', oa.goal_pressure_risk, 'gap', sa.goal_pressure_risk - oa.goal_pressure_risk),
    'role_clarity_risk', json_build_object('self', sa.role_clarity_risk, 'org', oa.role_clarity_risk, 'gap', sa.role_clarity_risk - oa.role_clarity_risk),
    'autonomy_control_risk', json_build_object('self', sa.autonomy_control_risk, 'org', oa.autonomy_control_risk, 'gap', sa.autonomy_control_risk - oa.autonomy_control_risk),
    'leadership_support_risk', json_build_object('self', sa.leadership_support_risk, 'org', oa.leadership_support_risk, 'gap', sa.leadership_support_risk - oa.leadership_support_risk),
    'peer_collaboration_risk', json_build_object('self', sa.peer_collaboration_risk, 'org', oa.peer_collaboration_risk, 'gap', sa.peer_collaboration_risk - oa.peer_collaboration_risk),
    'recognition_justice_risk', json_build_object('self', sa.recognition_justice_risk, 'org', oa.recognition_justice_risk, 'gap', sa.recognition_justice_risk - oa.recognition_justice_risk),
    'communication_change_risk', json_build_object('self', sa.communication_change_risk, 'org', oa.communication_change_risk, 'gap', sa.communication_change_risk - oa.communication_change_risk),
    'conflict_harassment_risk', json_build_object('self', sa.conflict_harassment_risk, 'org', oa.conflict_harassment_risk, 'gap', sa.conflict_harassment_risk - oa.conflict_harassment_risk),
    'recovery_boundaries_risk', json_build_object('self', sa.recovery_boundaries_risk, 'org', oa.recovery_boundaries_risk, 'gap', sa.recovery_boundaries_risk - oa.recovery_boundaries_risk)
  ) as dimensions_comparison,
  
  -- Análise do gap
  CASE 
    WHEN ABS(sa.self_score - ((oa.workload_pace_risk + oa.goal_pressure_risk + oa.role_clarity_risk +
                               oa.autonomy_control_risk + oa.leadership_support_risk + oa.peer_collaboration_risk +
                               oa.recognition_justice_risk + oa.communication_change_risk + oa.conflict_harassment_risk +
                               oa.recovery_boundaries_risk) / 10.0 * 5.0 / 3.0)) > 1.5 THEN 'critical_gap'
    WHEN ABS(sa.self_score - ((oa.workload_pace_risk + oa.goal_pressure_risk + oa.role_clarity_risk +
                               oa.autonomy_control_risk + oa.leadership_support_risk + oa.peer_collaboration_risk +
                               oa.recognition_justice_risk + oa.communication_change_risk + oa.conflict_harassment_risk +
                               oa.recovery_boundaries_risk) / 10.0 * 5.0 / 3.0)) > 1.0 THEN 'significant_gap'
    WHEN ABS(sa.self_score - ((oa.workload_pace_risk + oa.goal_pressure_risk + oa.role_clarity_risk +
                               oa.autonomy_control_risk + oa.leadership_support_risk + oa.peer_collaboration_risk +
                               oa.recognition_justice_risk + oa.communication_change_risk + oa.conflict_harassment_risk +
                               oa.recovery_boundaries_risk) / 10.0 * 5.0 / 3.0)) > 0.5 THEN 'moderate_gap'
    ELSE 'aligned'
  END as gap_severity,
  
  -- Tipo de gap
  CASE 
    WHEN sa.self_score > ((oa.workload_pace_risk + oa.goal_pressure_risk + oa.role_clarity_risk +
                          oa.autonomy_control_risk + oa.leadership_support_risk + oa.peer_collaboration_risk +
                          oa.recognition_justice_risk + oa.communication_change_risk + oa.conflict_harassment_risk +
                          oa.recovery_boundaries_risk) / 10.0 * 5.0 / 3.0) + 1.0 THEN 'optimistic_bias'
    WHEN sa.self_score < ((oa.workload_pace_risk + oa.goal_pressure_risk + oa.role_clarity_risk +
                          oa.autonomy_control_risk + oa.leadership_support_risk + oa.peer_collaboration_risk +
                          oa.recognition_justice_risk + oa.communication_change_risk + oa.conflict_harassment_risk +
                          oa.recovery_boundaries_risk) / 10.0 * 5.0 / 3.0) - 1.0 THEN 'pessimistic_bias'
    ELSE 'realistic_perception'
  END as perception_bias,
  
  -- Comentários
  sa.comments as employee_comments,
  oa.action_plan as organizational_action_plan,
  
  -- Datas
  sa.responded_at,
  oa.assessment_date,
  oa.assessed_by
  
FROM nr1_self_assessments sa
LEFT JOIN nr1_risk_assessments oa ON sa.organizational_assessment_id = oa.id
LEFT JOIN employees e ON sa.employee_id = e.id
WHERE sa.status = 'completed';

COMMENT ON VIEW v_nr1_comparative_analysis IS 'Análise comparativa entre auto-avaliação (percepção) e avaliação organizacional (realidade) para identificar gaps de percepção e áreas de desalinhamento';
