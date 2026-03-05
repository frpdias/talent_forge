-- ============================================================
-- Migration: get_matched_jobs() — Vagas compatíveis com perfil do candidato
-- Sprint 30 — Scoring: seniority (40pts) + employment_type (30pts) + salary (30pts)
-- ============================================================

-- Remove versão anterior se existir
DROP FUNCTION IF EXISTS public.get_matched_jobs();

CREATE OR REPLACE FUNCTION public.get_matched_jobs()
RETURNS TABLE (
  id            uuid,
  title         text,
  location      text,
  employment_type employment_type,
  seniority     seniority_level,
  salary_min    numeric,
  salary_max    numeric,
  created_at    timestamptz,
  org_name      text,
  match_score   int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH profile AS (
    SELECT
      seniority_level,
      employment_type   AS emp_types,
      salary_expectation
    FROM candidate_profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  ),
  candidate_org AS (
    SELECT owner_org_id
    FROM candidates
    WHERE user_id = auth.uid()
    LIMIT 1
  )
  SELECT
    j.id,
    j.title,
    j.location,
    j.employment_type,
    j.seniority,
    j.salary_min,
    j.salary_max,
    j.created_at,
    o.name AS org_name,
    (
      -- ── SENIORITY (40 pts) ─────────────────────────────────────
      -- Mapeia os valores do candidato (pt-BR) para os da vaga (enum)
      CASE
        WHEN p.seniority_level = 'estagiario' AND j.seniority = 'junior'   THEN 25
        WHEN p.seniority_level = 'junior'     AND j.seniority = 'junior'   THEN 40
        WHEN p.seniority_level = 'pleno'      AND j.seniority = 'mid'      THEN 40
        WHEN p.seniority_level = 'pleno'      AND j.seniority = 'senior'   THEN 20
        WHEN p.seniority_level = 'senior'     AND j.seniority = 'senior'   THEN 40
        WHEN p.seniority_level = 'senior'     AND j.seniority = 'mid'      THEN 20
        WHEN p.seniority_level = 'lead'       AND j.seniority = 'lead'     THEN 40
        WHEN p.seniority_level = 'lead'       AND j.seniority = 'senior'   THEN 20
        WHEN p.seniority_level = 'gerente'    AND j.seniority = 'lead'     THEN 35
        WHEN p.seniority_level = 'gerente'    AND j.seniority = 'director' THEN 20
        WHEN p.seniority_level = 'diretor'    AND j.seniority = 'director' THEN 40
        WHEN p.seniority_level = 'diretor'    AND j.seniority = 'executive'THEN 20
        WHEN p.seniority_level = 'c-level'    AND j.seniority = 'executive'THEN 40
        WHEN p.seniority_level = 'c-level'    AND j.seniority = 'director' THEN 20
        ELSE 0
      END
      +
      -- ── EMPLOYMENT TYPE (30 pts) ───────────────────────────────
      -- Mapeia nomes BR (text[]) para enum da vaga
      CASE
        WHEN 'CLT'       = ANY(p.emp_types) AND j.employment_type = 'full_time'   THEN 30
        WHEN 'PJ'        = ANY(p.emp_types) AND j.employment_type = 'contract'    THEN 30
        WHEN 'Estágio'   = ANY(p.emp_types) AND j.employment_type = 'internship'  THEN 30
        WHEN 'Freelancer'= ANY(p.emp_types) AND j.employment_type = 'freelance'   THEN 30
        WHEN 'Part-time' = ANY(p.emp_types) AND j.employment_type = 'part_time'   THEN 30
        WHEN p.emp_types IS NULL OR array_length(p.emp_types, 1) IS NULL          THEN 15
        ELSE 0
      END
      +
      -- ── SALARY (30 pts) ────────────────────────────────────────
      CASE
        WHEN p.salary_expectation IS NOT NULL
          AND j.salary_min IS NOT NULL AND j.salary_max IS NOT NULL
          AND p.salary_expectation BETWEEN j.salary_min AND j.salary_max          THEN 30
        WHEN p.salary_expectation IS NOT NULL
          AND j.salary_max IS NOT NULL
          AND p.salary_expectation <= j.salary_max                                THEN 15
        WHEN p.salary_expectation IS NULL
          OR (j.salary_min IS NULL AND j.salary_max IS NULL)                      THEN 10
        ELSE 0
      END
    )::int AS match_score
  FROM jobs j
  JOIN organizations o ON o.id = j.org_id
  CROSS JOIN profile p
  JOIN candidate_org co ON true
  WHERE j.status = 'open'
    AND j.org_id = co.owner_org_id
  ORDER BY match_score DESC, j.created_at DESC;
$$;

-- Grant para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_matched_jobs() TO authenticated;
