-- Add candidate source for reports
-- Allows tracking origin channel for candidate acquisition

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS candidates_owner_source_idx
  ON candidates(owner_org_id, source);
