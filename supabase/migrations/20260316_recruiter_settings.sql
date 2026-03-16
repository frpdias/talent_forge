-- Migration: Sprint 47 — Configurações do Recrutador (prompt de avaliação IA)
-- Tabela: recruiter_settings
-- RLS: user_id = auth.uid() AND is_org_member(org_id)

CREATE TABLE IF NOT EXISTS public.recruiter_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Prompt customizado para avaliação de candidatos via IA
  -- NULL = usa o prompt padrão do sistema
  review_prompt    TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, org_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rs_user_org ON public.recruiter_settings (user_id, org_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_rs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rs_updated_at ON public.recruiter_settings;
CREATE TRIGGER trg_rs_updated_at
  BEFORE UPDATE ON public.recruiter_settings
  FOR EACH ROW EXECUTE FUNCTION update_rs_updated_at();

-- RLS
ALTER TABLE public.recruiter_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas o próprio usuário dentro da org
CREATE POLICY "rs_select" ON public.recruiter_settings
  FOR SELECT USING (user_id = auth.uid() AND public.is_org_member(org_id));

-- INSERT
CREATE POLICY "rs_insert" ON public.recruiter_settings
  FOR INSERT WITH CHECK (user_id = auth.uid() AND public.is_org_member(org_id));

-- UPDATE
CREATE POLICY "rs_update" ON public.recruiter_settings
  FOR UPDATE USING (user_id = auth.uid() AND public.is_org_member(org_id));

-- DELETE
CREATE POLICY "rs_delete" ON public.recruiter_settings
  FOR DELETE USING (user_id = auth.uid() AND public.is_org_member(org_id));

-- service_role bypass
GRANT ALL ON public.recruiter_settings TO service_role;

COMMENT ON TABLE public.recruiter_settings IS
  'Configurações personalizadas por recrutador/org: prompt de avaliação IA e futuras preferências de uso.';
COMMENT ON COLUMN public.recruiter_settings.review_prompt IS
  'Prompt customizado para geração de parecer técnico via GPT-4o. NULL = usa prompt padrão do sistema.';
