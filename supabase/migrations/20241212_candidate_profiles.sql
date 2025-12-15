-- Migration: Candidate Complete Profile Tables
-- Created: 2024-12-12
-- Description: Adds tables for complete candidate profile with personal data, education, experience, and resume

-- Create candidate_profiles table (main profile data linked to auth.users)
create table if not exists candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  
  -- Dados pessoais
  full_name text,
  cpf text unique,
  email text,
  phone text,
  birth_date date,
  city text,
  state text,
  
  -- Dados profissionais
  current_title text,
  area_of_expertise text,
  seniority_level text check (seniority_level in ('estagiario', 'junior', 'pleno', 'senior', 'lead', 'gerente', 'diretor', 'c-level')),
  salary_expectation numeric,
  employment_type text[] default '{}', -- CLT, PJ, Estágio, Freelancer, etc.
  
  -- Resume/CV file
  resume_url text,
  resume_filename text,
  
  -- Profile status
  onboarding_completed boolean default false,
  onboarding_step int default 1,
  profile_completion_percentage int default 0,
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_profiles_user_idx on candidate_profiles(user_id);
create index if not exists candidate_profiles_cpf_idx on candidate_profiles(cpf);

-- Create candidate_education table
create table if not exists candidate_education (
  id uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  
  degree_level text not null check (degree_level in ('ensino_fundamental', 'ensino_medio', 'tecnico', 'graduacao', 'pos_graduacao', 'mestrado', 'doutorado', 'mba')),
  course_name text not null,
  institution text not null,
  start_year int,
  end_year int,
  is_current boolean default false,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_education_profile_idx on candidate_education(candidate_profile_id);

-- Create candidate_experience table
create table if not exists candidate_experience (
  id uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  
  company_name text not null,
  job_title text not null,
  start_date date not null,
  end_date date,
  is_current boolean default false,
  description text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_experience_profile_idx on candidate_experience(candidate_profile_id);

-- Enable RLS
alter table candidate_profiles enable row level security;
alter table candidate_education enable row level security;
alter table candidate_experience enable row level security;

-- RLS Policies for candidate_profiles
create policy candidate_profiles_select on candidate_profiles
  for select using (user_id = auth.uid());
  
create policy candidate_profiles_insert on candidate_profiles
  for insert with check (user_id = auth.uid());
  
create policy candidate_profiles_update on candidate_profiles
  for update using (user_id = auth.uid());

-- RLS Policies for candidate_education
create policy candidate_education_select on candidate_education
  for select using (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );
  
create policy candidate_education_insert on candidate_education
  for insert with check (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );
  
create policy candidate_education_update on candidate_education
  for update using (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );
  
create policy candidate_education_delete on candidate_education
  for delete using (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );

-- RLS Policies for candidate_experience
create policy candidate_experience_select on candidate_experience
  for select using (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );
  
create policy candidate_experience_insert on candidate_experience
  for insert with check (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );
  
create policy candidate_experience_update on candidate_experience
  for update using (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );
  
create policy candidate_experience_delete on candidate_experience
  for delete using (
    candidate_profile_id in (select id from candidate_profiles where user_id = auth.uid())
  );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_candidate_profiles_updated_at
  before update on candidate_profiles
  for each row execute function update_updated_at_column();

create trigger update_candidate_education_updated_at
  before update on candidate_education
  for each row execute function update_updated_at_column();

create trigger update_candidate_experience_updated_at
  before update on candidate_experience
  for each row execute function update_updated_at_column();

-- Storage bucket for resumes (run this in Supabase Dashboard SQL Editor)
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);
-- 
-- create policy "Users can upload their own resume"
--   on storage.objects for insert
--   with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- create policy "Users can read their own resume"
--   on storage.objects for select
--   using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- create policy "Users can update their own resume"
--   on storage.objects for update
--   using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- create policy "Users can delete their own resume"
--   on storage.objects for delete
--   using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
