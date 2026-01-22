-- Backfill candidates.user_id for existing rows
-- Date: 2026-01-22

-- Prefer candidate_profiles mapping by email
UPDATE public.candidates c
SET user_id = cp.user_id
FROM public.candidate_profiles cp
WHERE c.user_id IS NULL
  AND cp.email IS NOT NULL
  AND c.email = cp.email;

-- Fallback: match auth.users by email
UPDATE public.candidates c
SET user_id = au.id
FROM auth.users au
WHERE c.user_id IS NULL
  AND c.email IS NOT NULL
  AND au.email = c.email;
