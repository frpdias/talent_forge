-- Candidate invite links for recruiter -> candidate flow
-- Arquivo: 20260123_candidate_invite_links.sql
-- Data: 2026-01-23

CREATE TABLE IF NOT EXISTS candidate_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  max_uses INT DEFAULT 1,
  uses_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidate_invite_links_org_idx
  ON candidate_invite_links(org_id);
CREATE INDEX IF NOT EXISTS candidate_invite_links_token_idx
  ON candidate_invite_links(token);

ALTER TABLE candidate_invite_links ENABLE ROW LEVEL SECURITY;

-- Policies: only org members (owner/admin/recruiter) can manage links
DROP POLICY IF EXISTS "Org members manage candidate invite links" ON candidate_invite_links;
CREATE POLICY "Org members manage candidate invite links"
  ON candidate_invite_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = candidate_invite_links.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'recruiter')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = candidate_invite_links.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'recruiter')
    )
  );

-- Update timestamp trigger
DROP TRIGGER IF EXISTS update_candidate_invite_links_updated_at ON candidate_invite_links;
CREATE TRIGGER update_candidate_invite_links_updated_at
  BEFORE UPDATE ON candidate_invite_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE candidate_invite_links IS 'Links publicos para cadastro de candidatos por recrutador';
COMMENT ON COLUMN candidate_invite_links.token IS 'Token unico para convite';
COMMENT ON COLUMN candidate_invite_links.max_uses IS 'Numero maximo de usos (null = ilimitado)';
