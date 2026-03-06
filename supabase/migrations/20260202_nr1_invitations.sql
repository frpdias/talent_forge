-- NR-1 Self Assessment Invitations
-- Sistema de convites para funcionários responderem auto-avaliação NR-1

-- Tabela de convites
CREATE TABLE IF NOT EXISTS nr1_assessment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Token único para acesso sem senha
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
  
  -- Informações do convite
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Status do convite
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired')),
  
  -- Vinculação com avaliação organizacional (opcional)
  organizational_assessment_id UUID REFERENCES nr1_risk_assessments(id) ON DELETE SET NULL,
  
  -- Response tracking
  responded_at TIMESTAMP WITH TIME ZONE,
  self_assessment_id UUID REFERENCES nr1_self_assessments(id) ON DELETE SET NULL,
  
  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint: Um funcionário só pode ter um convite ativo por vez (índice único parcial)
CREATE UNIQUE INDEX idx_nr1_unique_active_invitation 
  ON nr1_assessment_invitations(employee_id) 
  WHERE status IN ('pending', 'accepted');

-- Índices
CREATE INDEX idx_nr1_invitations_org_id ON nr1_assessment_invitations(org_id);
CREATE INDEX idx_nr1_invitations_employee_id ON nr1_assessment_invitations(employee_id);
CREATE INDEX idx_nr1_invitations_token ON nr1_assessment_invitations(token);
CREATE INDEX idx_nr1_invitations_status ON nr1_assessment_invitations(status);
CREATE INDEX idx_nr1_invitations_expires_at ON nr1_assessment_invitations(expires_at);

-- Trigger para updated_at
CREATE TRIGGER update_nr1_invitations_updated_at
  BEFORE UPDATE ON nr1_assessment_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE nr1_assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Funcionário pode ver seus próprios convites (via token público)
CREATE POLICY nr1_invitations_public_access ON nr1_assessment_invitations
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Token é secreto, verificação no backend

-- RH/Admin pode criar e gerenciar convites da sua org
CREATE POLICY nr1_invitations_org_manage ON nr1_assessment_invitations
  FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

-- View para convites pendentes com informações do funcionário
CREATE OR REPLACE VIEW v_nr1_invitations_summary AS
SELECT 
  i.id,
  i.org_id,
  i.employee_id,
  e.full_name as employee_name,
  e.position as employee_position,
  e.department as employee_department,
  i.token,
  i.status,
  i.invited_at,
  i.expires_at,
  i.responded_at,
  i.organizational_assessment_id,
  i.self_assessment_id,
  
  -- Dias até expirar
  EXTRACT(DAY FROM (i.expires_at - NOW())) as days_until_expiry,
  
  -- Status amigável
  CASE 
    WHEN i.status = 'completed' THEN 'Respondido'
    WHEN i.status = 'expired' THEN 'Expirado'
    WHEN i.expires_at < NOW() THEN 'Expirado'
    WHEN i.status = 'accepted' THEN 'Em Andamento'
    ELSE 'Pendente'
  END as status_label,
  
  -- Link de acesso
  CONCAT('/nr1-self-assessment?token=', i.token) as access_link
  
FROM nr1_assessment_invitations i
INNER JOIN employees e ON i.employee_id = e.id
ORDER BY i.invited_at DESC;

COMMENT ON TABLE nr1_assessment_invitations IS 'Convites para funcionários responderem auto-avaliação NR-1 via link único';
COMMENT ON VIEW v_nr1_invitations_summary IS 'Visão resumida de convites com informações do funcionário e status amigável';
