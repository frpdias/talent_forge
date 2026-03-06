-- Backfill candidate_profiles.user_id for existing profiles
-- Date: 2026-01-22

-- Prefer matching by email with auth.users
UPDATE public.candidate_profiles cp
SET user_id = au.id
FROM auth.users au
WHERE cp.user_id IS NULL
  AND cp.email IS NOT NULL
  AND lower(trim(au.email)) = lower(trim(cp.email));

-- Fallback: match using candidates.user_id by email
UPDATE public.candidate_profiles cp
SET user_id = c.user_id
FROM public.candidates c
WHERE cp.user_id IS NULL
  AND c.user_id IS NOT NULL
  AND cp.email IS NOT NULL
  AND c.email IS NOT NULL
  AND lower(trim(c.email)) = lower(trim(cp.email));

-- Backfill candidates.user_id by email (auth.users)
UPDATE public.candidates c
SET user_id = au.id
FROM auth.users au
WHERE c.user_id IS NULL
  AND c.email IS NOT NULL
  AND lower(trim(au.email)) = lower(trim(c.email));

-- Backfill candidates.user_id by email (candidate_profiles)
UPDATE public.candidates c
SET user_id = cp.user_id
FROM public.candidate_profiles cp
WHERE c.user_id IS NULL
  AND cp.user_id IS NOT NULL
  AND c.email IS NOT NULL
  AND cp.email IS NOT NULL
  AND lower(trim(cp.email)) = lower(trim(c.email));

-- Backfill candidate_profiles.email from auth.users
UPDATE public.candidate_profiles cp
SET email = au.email
FROM auth.users au
WHERE (cp.email IS NULL OR cp.email = '')
  AND cp.user_id = au.id
  AND au.email IS NOT NULL;

-- Backfill candidate_profiles.email from candidates
UPDATE public.candidate_profiles cp
SET email = c.email
FROM public.candidates c
WHERE (cp.email IS NULL OR cp.email = '')
  AND c.email IS NOT NULL
  AND (
    (cp.user_id IS NOT NULL AND c.user_id = cp.user_id)
    OR (cp.user_id IS NULL AND cp.email IS NOT NULL AND lower(trim(c.email)) = lower(trim(cp.email)))
  );

-- Backfill candidates.email from candidate_profiles
UPDATE public.candidates c
SET email = cp.email
FROM public.candidate_profiles cp
WHERE (c.email IS NULL OR c.email = '')
  AND cp.email IS NOT NULL
  AND (
    (c.user_id IS NOT NULL AND cp.user_id = c.user_id)
    OR (c.user_id IS NULL AND c.email IS NOT NULL AND lower(trim(c.email)) = lower(trim(cp.email)))
  );

-- Create missing candidate_profiles from candidates (requires user_id)
INSERT INTO public.candidate_profiles (
  user_id,
  full_name,
  email,
  phone,
  city,
  current_title,
  salary_expectation,
  created_at,
  updated_at
)
SELECT
  COALESCE(c.user_id, au.id) AS user_id,
  c.full_name,
  COALESCE(c.email, au.email),
  c.phone,
  c.location,
  c.current_title,
  c.salary_expectation,
  NOW(),
  NOW()
FROM public.candidates c
LEFT JOIN auth.users au ON au.email = c.email
LEFT JOIN public.candidate_profiles cp
  ON (
    cp.user_id = COALESCE(c.user_id, au.id)
    OR (cp.email IS NOT NULL AND c.email IS NOT NULL AND lower(trim(cp.email)) = lower(trim(c.email)))
    OR (cp.email IS NOT NULL AND au.email IS NOT NULL AND lower(trim(cp.email)) = lower(trim(au.email)))
  )
WHERE COALESCE(c.user_id, au.id) IS NOT NULL
  AND cp.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Backfill candidate_profiles fields from candidates when missing
UPDATE public.candidate_profiles cp
SET
  full_name = COALESCE(cp.full_name, c.full_name),
  email = COALESCE(cp.email, c.email),
  phone = COALESCE(cp.phone, c.phone),
  city = COALESCE(cp.city, c.location),
  current_title = COALESCE(cp.current_title, c.current_title),
  salary_expectation = COALESCE(cp.salary_expectation, c.salary_expectation),
  updated_at = NOW()
FROM public.candidates c
WHERE
  (
    (cp.user_id IS NOT NULL AND c.user_id = cp.user_id)
    OR (cp.user_id IS NULL AND cp.email IS NOT NULL AND c.email IS NOT NULL AND lower(trim(c.email)) = lower(trim(cp.email)))
  )
  AND (
    cp.full_name IS NULL
    OR cp.email IS NULL
    OR cp.phone IS NULL
    OR cp.city IS NULL
    OR cp.current_title IS NULL
    OR cp.salary_expectation IS NULL
  );

-- Relink experience/education to profiles that now have user_id (match by email)
UPDATE public.candidate_experience ce
SET candidate_profile_id = cp_new.id
FROM public.candidate_profiles cp_old
JOIN public.candidate_profiles cp_new
  ON cp_new.user_id IS NOT NULL
  AND cp_old.email IS NOT NULL
  AND cp_new.email IS NOT NULL
  AND lower(trim(cp_new.email)) = lower(trim(cp_old.email))
WHERE ce.candidate_profile_id = cp_old.id
  AND cp_old.user_id IS NULL
  AND cp_new.id IS NOT NULL;

UPDATE public.candidate_education ce
SET candidate_profile_id = cp_new.id
FROM public.candidate_profiles cp_old
JOIN public.candidate_profiles cp_new
  ON cp_new.user_id IS NOT NULL
  AND cp_old.email IS NOT NULL
  AND cp_new.email IS NOT NULL
  AND lower(trim(cp_new.email)) = lower(trim(cp_old.email))
WHERE ce.candidate_profile_id = cp_old.id
  AND cp_old.user_id IS NULL
  AND cp_new.id IS NOT NULL;
