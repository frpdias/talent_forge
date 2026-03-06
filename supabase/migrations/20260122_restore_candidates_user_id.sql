-- Restore candidates.user_id column (removed in cleanup)
-- Date: 2026-01-22

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS candidates_user_idx ON public.candidates(user_id);
