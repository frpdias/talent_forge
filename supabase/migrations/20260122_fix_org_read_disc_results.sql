-- Allow org members to read DISC assessments/results by org linkage
-- Date: 2026-01-22

-- Assessments: allow org members to read by candidate_id or candidate_user_id linkage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'assessments'
      AND policyname = 'org_members_can_view_assessments'
  ) THEN
    CREATE POLICY org_members_can_view_assessments ON assessments
      FOR SELECT USING (
        candidate_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.candidates c
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE om.user_id = auth.uid()
            AND (c.id = assessments.candidate_id OR c.user_id = assessments.candidate_user_id)
        )
      );
  END IF;
END $$;

-- DISC results: allow org members to read via assessments linkage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'disc_assessments'
      AND policyname = 'org_members_can_view_disc_assessments'
  ) THEN
    CREATE POLICY org_members_can_view_disc_assessments ON disc_assessments
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM public.assessments a
          JOIN public.candidates c ON (c.id = a.candidate_id OR c.user_id = a.candidate_user_id)
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE a.id = disc_assessments.assessment_id
            AND om.user_id = auth.uid()
        )
      );
  END IF;
END $$;
