-- Fix existing applications without created_by
-- Date: 2026-01-22

-- Update existing applications to set created_by from candidate's user_id
UPDATE public.applications a
SET created_by = c.user_id
FROM public.candidates c
WHERE a.candidate_id = c.id
  AND a.created_by IS NULL
  AND c.user_id IS NOT NULL;

-- Verify the fix
SELECT 
  a.id as application_id,
  a.created_by,
  c.user_id as candidate_user_id,
  c.email as candidate_email,
  j.title as job_title
FROM public.applications a
JOIN public.candidates c ON c.id = a.candidate_id
JOIN public.jobs j ON j.id = a.job_id
ORDER BY a.created_at DESC
LIMIT 5;
