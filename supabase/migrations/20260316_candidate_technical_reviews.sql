-- Sprint 47: Parecer Técnico com IA + Score do Candidato
-- Tabela candidate_technical_reviews
-- Data: 2026-03-16

CREATE TABLE IF NOT EXISTS candidate_technical_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Score composto (0–100)
  score_total         NUMERIC(5,2) CHECK (score_total BETWEEN 0 AND 100),
  score_testes        NUMERIC(5,2) CHECK (score_testes BETWEEN 0 AND 100),
  score_experiencia   NUMERIC(5,2) CHECK (score_experiencia BETWEEN 0 AND 100),
  score_recrutador    NUMERIC(5,2) CHECK (score_recrutador BETWEEN 0 AND 100),

  -- Avaliação manual do recrutador (input antes de gerar)
  recruiter_rating    SMALLINT CHECK (recruiter_rating BETWEEN 0 AND 10),
  recruiter_note      TEXT,

  -- Parecer gerado pela IA
  ai_review           TEXT,
  ai_model            TEXT DEFAULT 'gpt-4o',

  -- Snapshot dos dados no momento da geração (para auditoria)
  input_snapshot      JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ctr_candidate_id ON candidate_technical_reviews(candidate_id);
CREATE INDEX idx_ctr_org_id       ON candidate_technical_reviews(org_id);
CREATE INDEX idx_ctr_created_at   ON candidate_technical_reviews(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_candidate_technical_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ctr_updated_at
  BEFORE UPDATE ON candidate_technical_reviews
  FOR EACH ROW EXECUTE FUNCTION update_candidate_technical_reviews_updated_at();

-- RLS
ALTER TABLE candidate_technical_reviews ENABLE ROW LEVEL SECURITY;

-- Recrutadores da org podem ver e criar
CREATE POLICY "ctr_select_org_member"
  ON candidate_technical_reviews FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "ctr_insert_org_member"
  ON candidate_technical_reviews FOR INSERT
  WITH CHECK (is_org_member(org_id));

CREATE POLICY "ctr_update_org_member"
  ON candidate_technical_reviews FOR UPDATE
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

CREATE POLICY "ctr_delete_org_member"
  ON candidate_technical_reviews FOR DELETE
  USING (is_org_member(org_id));

-- service_role tem acesso total (para a API route server-side)
GRANT ALL ON candidate_technical_reviews TO service_role;
GRANT SELECT, INSERT, UPDATE ON candidate_technical_reviews TO authenticated;
