-- Public function to list open jobs for candidates
-- Date: 2026-01-22

CREATE OR REPLACE FUNCTION public.get_open_jobs()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  employment_type employment_type,
  seniority seniority_level,
  salary_min numeric,
  salary_max numeric,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id,
    j.title,
    j.description,
    j.location,
    j.employment_type,
    j.seniority,
    j.salary_min,
    j.salary_max,
    j.created_at
  FROM public.jobs j
  WHERE j.status = 'open'
  ORDER BY j.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_open_jobs() TO authenticated;
