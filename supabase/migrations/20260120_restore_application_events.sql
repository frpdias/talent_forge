-- Restore application_events table
-- This table is actively used by the backend service (ApplicationsService) for tracking history
-- but was accidentally dropped in a previous cleanup.

CREATE TABLE IF NOT EXISTS application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  from_stage_id uuid references pipeline_stages(id),
  to_stage_id uuid references pipeline_stages(id),
  status application_status,
  note text,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS application_events_app_idx ON application_events(application_id);

-- Enable RLS
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

-- Restore RLS Policy (Access Allowed for Org Members of the related Job)
DROP POLICY IF EXISTS application_events_rw ON application_events;

CREATE POLICY application_events_rw ON application_events
  FOR ALL USING (
    is_org_member((
      select org_id from jobs j
      join applications a on a.job_id = j.id
      where a.id = application_events.application_id
    ))
  )
  WITH CHECK (
    is_org_member((
      select org_id from jobs j
      join applications a on a.job_id = j.id
      where a.id = application_events.application_id
    ))
  );
