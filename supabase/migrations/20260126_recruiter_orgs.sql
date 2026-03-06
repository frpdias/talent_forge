-- Create a dedicated organization for each recruiter/headhunter
-- Date: 2026-01-26

-- 1) Create organizations for recruiters that don't have a headhunter org yet
WITH recruiter_users AS (
  SELECT
    up.id AS user_id,
    up.full_name,
    au.email
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  WHERE up.user_type = 'recruiter'
),
existing_headhunter_orgs AS (
  SELECT om.user_id, o.id AS org_id
  FROM public.org_members om
  JOIN public.organizations o ON o.id = om.org_id
  WHERE o.org_type = 'headhunter'
    AND om.user_id IN (SELECT user_id FROM recruiter_users)
),
new_orgs AS (
  SELECT
    ru.user_id,
    COALESCE(ru.full_name, ru.email, 'Headhunter') || ' - ' || left(ru.user_id::text, 8) AS org_name,
    ru.email
  FROM recruiter_users ru
  LEFT JOIN existing_headhunter_orgs eho ON eho.user_id = ru.user_id
  WHERE eho.user_id IS NULL
)
INSERT INTO public.organizations (name, org_type, status, email)
SELECT org_name, 'headhunter', 'active', email
FROM new_orgs;

-- 2) Ensure recruiter is member (admin) of their headhunter org
WITH recruiter_users AS (
  SELECT
    up.id AS user_id,
    up.full_name,
    au.email
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  WHERE up.user_type = 'recruiter'
),
recruiter_orgs AS (
  SELECT
    ru.user_id,
    o.id AS org_id
  FROM recruiter_users ru
  JOIN public.organizations o
    ON o.name = COALESCE(ru.full_name, ru.email, 'Headhunter') || ' - ' || left(ru.user_id::text, 8)
    AND o.org_type = 'headhunter'
)
INSERT INTO public.org_members (org_id, user_id, role, status)
SELECT ro.org_id, ro.user_id, 'admin', 'active'
FROM recruiter_orgs ro
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 3) Remove other org memberships for recruiters (to keep them isolated)
WITH recruiter_users AS (
  SELECT id AS user_id
  FROM public.user_profiles
  WHERE user_type = 'recruiter'
),
recruiter_orgs AS (
  SELECT
    ru.user_id,
    o.id AS org_id
  FROM recruiter_users ru
  JOIN public.organizations o
    ON o.org_type = 'headhunter'
    AND o.name = COALESCE(
      (SELECT full_name FROM public.user_profiles up WHERE up.id = ru.user_id),
      (SELECT email FROM auth.users au WHERE au.id = ru.user_id),
      'Headhunter'
    ) || ' - ' || left(ru.user_id::text, 8)
)
DELETE FROM public.org_members om
USING recruiter_users ru
WHERE om.user_id = ru.user_id
  AND om.org_id NOT IN (SELECT org_id FROM recruiter_orgs);

-- 4) Reassign candidates created by recruiters to their headhunter org
WITH recruiter_users AS (
  SELECT id AS user_id
  FROM public.user_profiles
  WHERE user_type = 'recruiter'
),
recruiter_orgs AS (
  SELECT
    ru.user_id,
    o.id AS org_id
  FROM recruiter_users ru
  JOIN public.organizations o
    ON o.org_type = 'headhunter'
    AND o.name = COALESCE(
      (SELECT full_name FROM public.user_profiles up WHERE up.id = ru.user_id),
      (SELECT email FROM auth.users au WHERE au.id = ru.user_id),
      'Headhunter'
    ) || ' - ' || left(ru.user_id::text, 8)
)
UPDATE public.candidates c
SET owner_org_id = ro.org_id
FROM recruiter_orgs ro
WHERE c.created_by = ro.user_id
  AND c.owner_org_id IS DISTINCT FROM ro.org_id;
