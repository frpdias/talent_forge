-- Candidate applied jobs lookup
-- Date: 2026-01-22

CREATE OR REPLACE FUNCTION public.get_my_applied_jobs()
RETURNS TABLE (
  job_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.job_id
  FROM public.applications a
  JOIN public.candidates c ON c.id = a.candidate_id
  WHERE c.user_id = auth.uid()
     OR (c.email IS NOT NULL AND c.email = auth.email());
$$;

GRANT EXECUTE ON FUNCTION public.get_my_applied_jobs() TO authenticated;
