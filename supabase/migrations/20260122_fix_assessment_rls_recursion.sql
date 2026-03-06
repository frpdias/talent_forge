-- Fix RLS recursion and allow candidate assessment inserts
-- Date: 2026-01-22

-- Avoid RLS recursion in is_org_member by bypassing row security
CREATE OR REPLACE FUNCTION public.is_org_member(org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org AND om.user_id = auth.uid()
  );
$$;

-- Allow candidates to insert their own assessments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND policyname = 'Candidates can insert own assessments'
  ) THEN
    CREATE POLICY "Candidates can insert own assessments" ON assessments
      FOR INSERT WITH CHECK (candidate_user_id = auth.uid());
  END IF;
END $$;
