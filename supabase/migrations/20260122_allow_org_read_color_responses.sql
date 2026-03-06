-- Allow recruiters/admins to read color responses tied to candidates in their org
-- Date: 2026-01-22

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'color_responses' AND policyname = 'color_responses_select_org'
  ) THEN
    CREATE POLICY color_responses_select_org ON color_responses
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM public.color_assessments ca
          JOIN public.candidates c ON c.user_id = ca.candidate_user_id
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE ca.id = color_responses.assessment_id
            AND om.user_id = auth.uid()
        )
      );
  END IF;
END $$;
