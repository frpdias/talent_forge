-- Allow org members to read candidate profiles linked to their org candidates
-- Date: 2026-01-22

DROP POLICY IF EXISTS candidate_profiles_select_org ON public.candidate_profiles;

CREATE POLICY candidate_profiles_select_org ON public.candidate_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.candidates c
      WHERE c.user_id = candidate_profiles.user_id
        AND is_org_member(c.owner_org_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.candidates c
      WHERE c.email IS NOT NULL
        AND c.email = candidate_profiles.email
        AND is_org_member(c.owner_org_id)
    )
  );
