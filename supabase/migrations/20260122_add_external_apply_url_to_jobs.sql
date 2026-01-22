-- Add external_apply_url to jobs if missing
-- Date: 2026-01-22

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS external_apply_url TEXT;
