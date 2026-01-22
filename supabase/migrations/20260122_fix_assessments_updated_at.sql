-- Add updated_at to assessments to satisfy update trigger
-- Date: 2026-01-22

ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
