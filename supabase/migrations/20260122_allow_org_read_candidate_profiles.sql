-- Allow recruiters/admins to read candidate profiles linked to their org candidates
-- Date: 2026-01-22

-- Candidate profiles: allow org members to read profiles for candidates in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' AND policyname = 'candidate_profiles_select_org'
  ) THEN
    CREATE POLICY candidate_profiles_select_org ON candidate_profiles
      FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.candidates c
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE om.user_id = auth.uid()
            AND (
              c.user_id = candidate_profiles.user_id
              OR (c.email IS NOT NULL AND c.email = candidate_profiles.email)
            )
        )
      );
  END IF;
END $$;

-- Candidate education: allow org members to read education for candidates in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_select_org'
  ) THEN
    CREATE POLICY candidate_education_select_org ON candidate_education
      FOR SELECT USING (
        candidate_profile_id IN (
          SELECT cp.id
          FROM public.candidate_profiles cp
          JOIN public.candidates c ON (
            c.user_id = cp.user_id
            OR (c.email IS NOT NULL AND c.email = cp.email)
          )
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE om.user_id = auth.uid()
        )
        OR candidate_profile_id IN (
          SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Candidate experience: allow org members to read experience for candidates in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_select_org'
  ) THEN
    CREATE POLICY candidate_experience_select_org ON candidate_experience
      FOR SELECT USING (
        candidate_profile_id IN (
          SELECT cp.id
          FROM public.candidate_profiles cp
          JOIN public.candidates c ON (
            c.user_id = cp.user_id
            OR (c.email IS NOT NULL AND c.email = cp.email)
          )
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE om.user_id = auth.uid()
        )
        OR candidate_profile_id IN (
          SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
