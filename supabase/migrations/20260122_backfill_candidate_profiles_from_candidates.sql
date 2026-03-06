-- Backfill candidate_profiles from candidates for existing users
-- Date: 2026-01-22

-- Create missing candidate_profiles for candidates that already have auth.users
INSERT INTO public.candidate_profiles (
  user_id,
  full_name,
  email,
  phone,
  current_title,
  city,
  state
)
SELECT
  COALESCE(c.user_id, au.id) AS user_id,
  c.full_name,
  c.email,
  c.phone,
  c.current_title,
  CASE
    WHEN c.location IS NULL THEN NULL
    WHEN POSITION(',' IN c.location) > 0 THEN NULLIF(TRIM(SPLIT_PART(c.location, ',', 1)), '')
    ELSE NULLIF(TRIM(c.location), '')
  END AS city,
  CASE
    WHEN c.location IS NULL THEN NULL
    WHEN POSITION(',' IN c.location) > 0 THEN NULLIF(TRIM(SPLIT_PART(c.location, ',', 2)), '')
    ELSE NULL
  END AS state
FROM public.candidates c
JOIN auth.users au ON au.email = c.email
WHERE c.email IS NOT NULL
  AND (c.user_id IS NULL OR c.user_id = au.id)
  AND NOT EXISTS (
    SELECT 1
    FROM public.candidate_profiles cp
    WHERE cp.user_id = COALESCE(c.user_id, au.id)
  );
