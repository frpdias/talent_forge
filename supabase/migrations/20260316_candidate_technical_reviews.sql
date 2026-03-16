-- Migration: Sprint 47 — Parecer Técnico com IA + Score do Candidato
-- Tabela: candidate_technical_reviews
-- RLS: is_org_member(org_id)

CREATE TABLE IF NOT EXISTS public.candidate_technical_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id     UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  generated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Scores (0-100)
  score_total      NUMERIC(5,2) CHECK (score_total >= 0 AND score_total <= 100),
  score_testes     NUMERIC(5,2) CHECK (score_testes >= 0 AND score_testes <= 100),
  score_experiencia NUMERIC(5,2) CHECK (score_experiencia >= 0 AND score_experiencia <= 100),
  score_recrutador  NUMERIC(5,2) CHECK (score_recrutador >= 0 AND score_recrutador <= 100),

  -- Avaliação do recrutador
  recruiter_rating SMALLINT CHECK (recruiter_rating >= 0 AND recruiter_rating <= 10),
  recruiter_note   TEXT,

  -- Parecer gerado por IA
  ai_review        TEXT,
  ai_model         TEXT NOT NULL DEFAULT 'gpt-4o',

  -- Snapshot dos dados usados na geração (para auditoria)
  input_snapshot   JSONB,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ctr_candidate_id ON public.candidate_technical_reviews (candidate_id);
CREATE INDEX IF NOT EXISTS idx_ctr_org_id       ON public.candidate_technical_reviews (org_id);
CREATE INDEX IF NOT EXISTS idx_ctr_created_at   ON public.candidate_technical_reviews (created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_ctr_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ctr_updated_at ON public.candidate_technical_reviews;
CREATE TRIGGER trg_ctr_updated_at
  BEFORE UPDATE ON public.candidate_technical_reviews
  FOR EACH ROW EXECUTE FUNCTION update_ctr_updated_at();

-- RLS
ALTER TABLE public.candidate_technical_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: membros da org
CREATE POLICY "ctr_select" ON public.candidate_technical_reviews
  FOR SELECT USING (public.is_org_member(org_id));

-- INSERT: membros da org
CREATE POLICY "ctr_insert" ON public.candidate_technical_reviews
  FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- UPDATE: membros da org
CREATE POLICY "ctr_update" ON public.candidate_technical_reviews
  FOR UPDATE USING (public.is_org_member(org_id));

-- DELETE: membros da org
CREATE POLICY "ctr_delete" ON public.candidate_technical_reviews
  FOR DELETE USING (public.is_org_member(org_id));

-- service_role bypass (backend admin)
GRANT ALL ON public.candidate_technical_reviews TO service_role;

COMMENT ON TABLE public.candidate_technical_reviews IS
  'Pareceres técnicos gerados por IA para candidatos, incluindo score calculado (testes 40% + experiência 35% + recrutador 25%) e text do parecer via GPT-4o.';
