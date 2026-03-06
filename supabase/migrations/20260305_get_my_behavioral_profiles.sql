-- ============================================================
-- Migration: get_my_behavioral_profiles
-- Sprint 30 — Funções SECURITY DEFINER para leitura de perfis
--             comportamentais (DISC / Cores / PI)
--
-- Problema: assessments.candidate_user_id pode ter sido setado com
-- um UUID errado quando o candidato não tinha user_id em candidates.
-- As queries diretas falham para esses candidatos.
--
-- Solução: funções que fazem fallback via candidates.email igual ao
-- padrão já adotado em get_my_applications().
-- ============================================================

-- 1. DISC — junta assessments + disc_assessments com fallback por email
CREATE OR REPLACE FUNCTION public.get_my_disc_result()
RETURNS TABLE (
  primary_profile       TEXT,
  secondary_profile     TEXT,
  dominance_score       NUMERIC,
  influence_score       NUMERIC,
  steadiness_score      NUMERIC,
  conscientiousness_score NUMERIC,
  description           TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    da.primary_profile,
    da.secondary_profile,
    da.dominance_score,
    da.influence_score,
    da.steadiness_score,
    da.conscientiousness_score,
    da.description
  FROM assessments a
  LEFT JOIN disc_assessments da ON da.assessment_id = a.id
  WHERE a.assessment_type = 'disc'
    AND a.status = 'completed'
    AND (
      a.candidate_user_id = auth.uid()
      OR a.candidate_id IN (
        SELECT id FROM candidates
        WHERE user_id = auth.uid()
          OR (email IS NOT NULL AND email = (auth.jwt() ->> 'email'))
      )
    )
  ORDER BY a.completed_at DESC NULLS LAST, a.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_disc_result() TO authenticated;

-- 2. Cores — fallback por email em color_assessments
CREATE OR REPLACE FUNCTION public.get_my_color_result()
RETURNS SETOF color_assessments
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ca.*
  FROM color_assessments ca
  WHERE ca.status = 'completed'
    AND (
      ca.candidate_user_id = auth.uid()
      OR ca.candidate_user_id IN (
        SELECT au.id FROM auth.users au
        JOIN candidates c ON (
          c.user_id = au.id
          OR (c.email IS NOT NULL AND c.email = au.email)
        )
        WHERE c.user_id = auth.uid()
          OR (c.email IS NOT NULL AND c.email = (auth.jwt() ->> 'email'))
      )
    )
  ORDER BY ca.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_color_result() TO authenticated;

-- 3. PI — fallback por email em pi_assessments
CREATE OR REPLACE FUNCTION public.get_my_pi_result()
RETURNS SETOF pi_assessments
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pa.*
  FROM pi_assessments pa
  WHERE pa.status = 'completed'
    AND (
      pa.candidate_user_id = auth.uid()
      OR pa.candidate_user_id IN (
        SELECT au.id FROM auth.users au
        JOIN candidates c ON (
          c.user_id = au.id
          OR (c.email IS NOT NULL AND c.email = au.email)
        )
        WHERE c.user_id = auth.uid()
          OR (c.email IS NOT NULL AND c.email = (auth.jwt() ->> 'email'))
      )
    )
  ORDER BY pa.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pi_result() TO authenticated;
