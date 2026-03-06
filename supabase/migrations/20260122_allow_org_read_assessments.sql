-- Allow recruiters/admins to read assessments tied to candidates in their org
-- Date: 2026-01-22

-- Color assessments: allow org members to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'color_assessments' AND policyname = 'color_assessments_select_org'
  ) THEN
    CREATE POLICY color_assessments_select_org ON color_assessments
      FOR SELECT USING (
        candidate_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.candidates c
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE om.user_id = auth.uid()
            AND c.user_id = color_assessments.candidate_user_id
        )
      );
  END IF;
END $$;

-- PI assessments: allow org members to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pi_assessments' AND policyname = 'pi_assessments_select_org'
  ) THEN
    CREATE POLICY pi_assessments_select_org ON pi_assessments
      FOR SELECT USING (
        candidate_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.candidates c
          JOIN public.org_members om ON om.org_id = c.owner_org_id
          WHERE om.user_id = auth.uid()
            AND c.user_id = pi_assessments.candidate_user_id
        )
      );
  END IF;
END $$;
