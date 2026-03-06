-- TalentForge - Supabase (Postgres) initial schema draft
-- Targets MVP: headhunters, companies, jobs, pipeline Kanban, candidates, applications, basic assessments
-- Assumes Supabase auth; uses auth.users for authenticated identities.

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
  traits jsonb, -- store Big Five/DISC traits, percentile, etc.
  created_at timestamptz not null default now()
);

create index if not exists assessments_candidate_idx on assessments(candidate_id);
create index if not exists assessments_job_idx on assessments(job_id);

-- Suggested RLS (enable in Supabase UI/CLI):
--   enable row level security on each table
--   policies:
--     - org_members can read/write rows where org_id matches membership (including owner_org_id for candidates)
--     - applications join through jobs.org_id for scoping
--     - assessments scoped by candidate.owner_org_id
