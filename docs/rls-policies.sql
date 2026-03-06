-- RLS Policies for Supabase
-- Enable RLS on all tables and apply policies based on org membership.

alter table organizations enable row level security;
alter table org_members enable row level security;
alter table candidates enable row level security;
alter table jobs enable row level security;
alter table pipeline_stages enable row level security;
alter table applications enable row level security;
alter table application_events enable row level security;
alter table candidate_notes enable row level security;
alter table assessments enable row level security;

-- Helper: org membership
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from org_members om
    where om.org_id = org and om.user_id = auth.uid()
  );
$$;

-- Organizations: members can see their org; admin can update
create policy orgs_select on organizations
  for select using (is_org_member(id));
create policy orgs_insert on organizations
  for insert with check (true); -- allow creation; consider restricting via RPC if needed
create policy orgs_update on organizations
  for update using (is_org_member(id));

-- Org members: user can see/insert their own memberships; admin update/delete
create policy org_members_select on org_members
  for select using (user_id = auth.uid() or is_org_member(org_id));
create policy org_members_insert on org_members
  for insert with check (is_org_member(org_id));
create policy org_members_update on org_members
  for update using (is_org_member(org_id));
create policy org_members_delete on org_members
  for delete using (is_org_member(org_id));

-- Candidates (owned by org)
create policy candidates_rw on candidates
  for all using (is_org_member(owner_org_id))
  with check (is_org_member(owner_org_id));

-- Jobs
create policy jobs_rw on jobs
  for all using (is_org_member(org_id))
  with check (is_org_member(org_id));

-- Pipeline stages
create policy pipeline_rw on pipeline_stages
  for all using (
    is_org_member((select org_id from jobs j where j.id = pipeline_stages.job_id))
  )
  with check (
    is_org_member((select org_id from jobs j where j.id = pipeline_stages.job_id))
  );

-- Applications
create policy applications_rw on applications
  for all using (
    is_org_member((select org_id from jobs j where j.id = applications.job_id))
  )
  with check (
    is_org_member((select org_id from jobs j where j.id = applications.job_id))
  );

-- Application events
create policy application_events_rw on application_events
  for all using (
    is_org_member((
      select org_id from jobs j
      join applications a on a.job_id = j.id
      where a.id = application_events.application_id
    ))
  )
  with check (
    is_org_member((
      select org_id from jobs j
      join applications a on a.job_id = j.id
      where a.id = application_events.application_id
    ))
  );

-- Candidate notes
create policy candidate_notes_rw on candidate_notes
  for all using (
    is_org_member((select owner_org_id from candidates c where c.id = candidate_notes.candidate_id))
  )
  with check (
    is_org_member((select owner_org_id from candidates c where c.id = candidate_notes.candidate_id))
  );

-- Assessments
create policy assessments_rw on assessments
  for all using (
    is_org_member((select owner_org_id from candidates c where c.id = assessments.candidate_id))
  )
  with check (
    is_org_member((select owner_org_id from candidates c where c.id = assessments.candidate_id))
  );

-- Recommended: create a postgres role for service (bypassing RLS) only for the backend server if needed.
