-- Candidate applications list
-- Date: 2026-01-22

CREATE OR REPLACE FUNCTION public.get_my_applications()
RETURNS TABLE (
  application_id uuid,
  job_id uuid,
  job_title text,
  job_location text,
  status application_status,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id as application_id,
    a.job_id,
    j.title as job_title,
    j.location as job_location,
    a.status,
    a.created_at
  FROM public.applications a
  JOIN public.candidates c ON c.id = a.candidate_id
  JOIN public.jobs j ON j.id = a.job_id
  WHERE c.user_id = auth.uid()
      OR (c.email IS NOT NULL AND c.email = auth.email())
  ORDER BY a.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_applications() TO authenticated;
