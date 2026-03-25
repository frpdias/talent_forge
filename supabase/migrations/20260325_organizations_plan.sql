-- Migration: Sprint 62 — Coluna de plano nas organizações (free / pro / enterprise)
-- Usada para rotear chamadas de IA: free → Ollama local, pro/enterprise → OpenAI GPT-4o

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro', 'enterprise'));

COMMENT ON COLUMN public.organizations.plan IS
  'Plano da organização: free (IA via Ollama local), pro (OpenAI GPT-4o), enterprise (OpenAI GPT-4o + features avançadas).';

-- Índice para queries de billing/admin
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON public.organizations (plan);
