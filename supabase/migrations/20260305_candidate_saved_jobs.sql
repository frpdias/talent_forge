-- =============================================================================
-- Sprint 30.2: candidate_saved_jobs
-- Re-introduz a tabela seguindo padrões canônicos atuais (RLS por user_id)
-- A versão anterior foi removida em 20260203_cleanup_unused_tables.sql por não
-- seguir os padrões arquiteturais. Esta versão é canônica.
-- Date: 2026-03-05
-- =============================================================================

-- Tabela
CREATE TABLE IF NOT EXISTS public.candidate_saved_jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_candidate_saved_jobs_user_id ON public.candidate_saved_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_saved_jobs_job_id  ON public.candidate_saved_jobs (job_id);

-- RLS
ALTER TABLE public.candidate_saved_jobs ENABLE ROW LEVEL SECURITY;

-- Candidato só acessa suas próprias entradas
DROP POLICY IF EXISTS "candidate_saved_jobs_select" ON public.candidate_saved_jobs;
CREATE POLICY "candidate_saved_jobs_select"
  ON public.candidate_saved_jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "candidate_saved_jobs_insert" ON public.candidate_saved_jobs;
CREATE POLICY "candidate_saved_jobs_insert"
  ON public.candidate_saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "candidate_saved_jobs_delete" ON public.candidate_saved_jobs;
CREATE POLICY "candidate_saved_jobs_delete"
  ON public.candidate_saved_jobs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- RPC: get_my_saved_jobs()
-- Retorna vagas salvas do candidato autenticado com detalhes do job
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_my_saved_jobs()
RETURNS TABLE (
  saved_id        uuid,
  saved_at        timestamptz,
  id              uuid,
  title           text,
  description     text,
  location        text,
  employment_type employment_type,
  seniority       seniority_level,
  salary_min      numeric,
  salary_max      numeric,
  created_at      timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    csj.id          AS saved_id,
    csj.created_at  AS saved_at,
    j.id,
    j.title,
    j.description,
    j.location,
    j.employment_type,
    j.seniority,
    j.salary_min,
    j.salary_max,
    j.created_at
  FROM public.candidate_saved_jobs csj
  JOIN public.jobs j ON j.id = csj.job_id
  WHERE csj.user_id = auth.uid()
  ORDER BY csj.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_saved_jobs() TO authenticated;
