-- MIGRATION: Add CBO column to Jobs table
-- Date: 2026-01-20

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS cbo_code TEXT;

-- Create FK (doing it separately to avoid error if table doesn't exist in some envs yet, 
-- though it should based on previous steps)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ref_cbo') THEN
    ALTER TABLE jobs 
    ADD CONSTRAINT jobs_cbo_code_fkey 
    FOREIGN KEY (cbo_code) 
    REFERENCES ref_cbo(code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS jobs_cbo_code_idx ON jobs(cbo_code);
