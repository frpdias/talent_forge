-- Ensure RLS policies for candidate education/experience
-- Date: 2026-01-22

ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_select'
  ) THEN
    CREATE POLICY candidate_education_select ON public.candidate_education
      FOR SELECT USING (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_insert'
  ) THEN
    CREATE POLICY candidate_education_insert ON public.candidate_education
      FOR INSERT WITH CHECK (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_update'
  ) THEN
    CREATE POLICY candidate_education_update ON public.candidate_education
      FOR UPDATE USING (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_delete'
  ) THEN
    CREATE POLICY candidate_education_delete ON public.candidate_education
      FOR DELETE USING (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_select'
  ) THEN
    CREATE POLICY candidate_experience_select ON public.candidate_experience
      FOR SELECT USING (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_insert'
  ) THEN
    CREATE POLICY candidate_experience_insert ON public.candidate_experience
      FOR INSERT WITH CHECK (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_update'
  ) THEN
    CREATE POLICY candidate_experience_update ON public.candidate_experience
      FOR UPDATE USING (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_delete'
  ) THEN
    CREATE POLICY candidate_experience_delete ON public.candidate_experience
      FOR DELETE USING (
        candidate_profile_id IN (SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
