-- Migration: org_career_tips
-- Dicas para candidatos, editáveis pelo headhunter, exibidas na career page

CREATE TABLE IF NOT EXISTS org_career_tips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL DEFAULT '',
  content       TEXT NOT NULL DEFAULT '',
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_org_career_tips_org_id ON org_career_tips(org_id);
CREATE INDEX IF NOT EXISTS idx_org_career_tips_order  ON org_career_tips(org_id, display_order);

-- RLS
ALTER TABLE org_career_tips ENABLE ROW LEVEL SECURITY;

-- Leitura pública (career page pública via anon)
CREATE POLICY "public_read_active_tips"
  ON org_career_tips FOR SELECT
  USING (is_active = true);

-- Escrita: apenas membros autenticados da org
CREATE POLICY "org_members_manage_tips"
  ON org_career_tips FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

-- Grant
GRANT SELECT ON org_career_tips TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON org_career_tips TO authenticated;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_career_tips_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_career_tips_updated_at
  BEFORE UPDATE ON org_career_tips
  FOR EACH ROW EXECUTE FUNCTION update_career_tips_updated_at();
