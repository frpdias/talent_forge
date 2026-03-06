-- Initial schema for TalentForge (Supabase)
-- Copied from docs/data-model.sql

-- Note: avoid IF NOT EXISTS for types to keep parser compatibility during push
create type org_type as enum ('headhunter', 'company');
create type employment_type as enum ('full_time', 'part_time', 'contract', 'internship', 'freelance');
create type seniority_level as enum ('junior', 'mid', 'senior', 'lead', 'director', 'executive');
create type application_status as enum ('applied', 'in_process', 'hired', 'rejected');
create type assessment_kind as enum ('behavioral_v1');

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type org_type not null,
  slug text generated always as (regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'manager', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  owner_org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  location text,
  current_title text,
  linkedin_url text,
  salary_expectation numeric,
  availability_date date,
  tags text[],
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidates_owner_idx on candidates(owner_org_id);
create index if not exists candidates_email_idx on candidates(email);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  location text,
  salary_min numeric,
  salary_max numeric,
  employment_type employment_type,
  seniority seniority_level,
  status text not null default 'open' check (status in ('open', 'on_hold', 'closed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_org_idx on jobs(org_id);
create index if not exists jobs_status_idx on jobs(status);

create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  name text not null,
  position int not null,
  created_at timestamptz not null default now(),
  unique (job_id, position)
);

create index if not exists pipeline_stages_job_idx on pipeline_stages(job_id);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  current_stage_id uuid references pipeline_stages(id),
  status application_status not null default 'applied',
  score numeric,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index if not exists applications_job_idx on applications(job_id);
create index if not exists applications_candidate_idx on applications(candidate_id);
create index if not exists applications_status_idx on applications(status);

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  from_stage_id uuid references pipeline_stages(id),
  to_stage_id uuid references pipeline_stages(id),
  status application_status,
  note text,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists application_events_app_idx on application_events(application_id);

create table if not exists candidate_notes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  author_id uuid references auth.users(id),
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists candidate_notes_candidate_idx on candidate_notes(candidate_id);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  assessment_kind assessment_kind not null default 'behavioral_v1',
  raw_score numeric,
  normalized_score numeric,
  traits jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assessments_candidate_idx on assessments(candidate_id);
create index if not exists assessments_job_idx on assessments(job_id);

-- RLS policies (from docs/rls-policies.sql)

alter table organizations enable row level security;
alter table org_members enable row level security;
alter table candidates enable row level security;
alter table jobs enable row level security;
alter table pipeline_stages enable row level security;
alter table applications enable row level security;
alter table application_events enable row level security;
alter table candidate_notes enable row level security;
alter table assessments enable row level security;

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

create policy orgs_select on organizations
  for select using (is_org_member(id));
create policy orgs_insert on organizations
  for insert with check (true);
create policy orgs_update on organizations
  for update using (is_org_member(id));

create policy org_members_select on org_members
  for select using (user_id = auth.uid() or is_org_member(org_id));
create policy org_members_insert on org_members
  for insert with check (is_org_member(org_id));
create policy org_members_update on org_members
  for update using (is_org_member(org_id));
create policy org_members_delete on org_members
  for delete using (is_org_member(org_id));

create policy candidates_rw on candidates
  for all using (is_org_member(owner_org_id))
  with check (is_org_member(owner_org_id));

create policy jobs_rw on jobs
  for all using (is_org_member(org_id))
  with check (is_org_member(org_id));

create policy pipeline_rw on pipeline_stages
  for all using (
    is_org_member((select org_id from jobs j where j.id = pipeline_stages.job_id))
  )
  with check (
    is_org_member((select org_id from jobs j where j.id = pipeline_stages.job_id))
  );

create policy applications_rw on applications
  for all using (
    is_org_member((select org_id from jobs j where j.id = applications.job_id))
  )
  with check (
    is_org_member((select org_id from jobs j where j.id = applications.job_id))
  );

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

create policy candidate_notes_rw on candidate_notes
  for all using (
    is_org_member((select owner_org_id from candidates c where c.id = candidate_notes.candidate_id))
  )
  with check (
    is_org_member((select owner_org_id from candidates c where c.id = candidate_notes.candidate_id))
  );

create policy assessments_rw on assessments
  for all using (
    is_org_member((select owner_org_id from candidates c where c.id = assessments.candidate_id))
  )
  with check (
    is_org_member((select owner_org_id from candidates c where c.id = assessments.candidate_id))
  );
