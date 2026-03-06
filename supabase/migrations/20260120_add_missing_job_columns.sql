-- Add missing columns to jobs table
-- These columns are used by the job creation form but were missing from the original schema

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'full-time';
