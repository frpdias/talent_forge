-- Migration: org_testimonials
-- Depoimentos editáveis por organização na career page

CREATE TABLE IF NOT EXISTS org_testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_name   TEXT NOT NULL,
  author_role   TEXT,
  text          TEXT NOT NULL,
  avatar_color  TEXT DEFAULT '#6366f1',
  rating        SMALLINT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_org_testimonials_org_id ON org_testimonials(org_id);
CREATE INDEX IF NOT EXISTS idx_org_testimonials_order  ON org_testimonials(org_id, display_order);

-- RLS
ALTER TABLE org_testimonials ENABLE ROW LEVEL SECURITY;

-- Leitura pública (career page pública acessa via anon)
CREATE POLICY "public_read_active_testimonials"
  ON org_testimonials FOR SELECT
  USING (is_active = true);

-- Escrita: apenas membros autenticados da org
CREATE POLICY "org_members_manage_testimonials"
  ON org_testimonials FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

-- Grant
GRANT SELECT ON org_testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON org_testimonials TO authenticated;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_testimonials_updated_at
  BEFORE UPDATE ON org_testimonials
  FOR EACH ROW EXECUTE FUNCTION update_testimonials_updated_at();
