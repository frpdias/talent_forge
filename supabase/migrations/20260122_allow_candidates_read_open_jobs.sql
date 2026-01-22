-- Allow candidates to read open jobs
-- Date: 2026-01-22

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'jobs_public_open_select'
  ) THEN
    CREATE POLICY jobs_public_open_select ON jobs
      FOR SELECT
      TO authenticated
      USING (status = 'open');
  END IF;
END $$;
