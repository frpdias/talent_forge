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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' AND policyname = 'candidate_profiles_select'
  ) THEN
    CREATE POLICY candidate_profiles_select ON candidate_profiles
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' AND policyname = 'candidate_profiles_insert'
  ) THEN
    CREATE POLICY candidate_profiles_insert ON candidate_profiles
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' AND policyname = 'candidate_profiles_update'
  ) THEN
    CREATE POLICY candidate_profiles_update ON candidate_profiles
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS Policies for candidate_education
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_select'
  ) THEN
    CREATE POLICY candidate_education_select ON candidate_education
      FOR SELECT USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_insert'
  ) THEN
    CREATE POLICY candidate_education_insert ON candidate_education
      FOR INSERT WITH CHECK (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_update'
  ) THEN
    CREATE POLICY candidate_education_update ON candidate_education
      FOR UPDATE USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_education' AND policyname = 'candidate_education_delete'
  ) THEN
    CREATE POLICY candidate_education_delete ON candidate_education
      FOR DELETE USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- RLS Policies for candidate_experience
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_select'
  ) THEN
    CREATE POLICY candidate_experience_select ON candidate_experience
      FOR SELECT USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_insert'
  ) THEN
    CREATE POLICY candidate_experience_insert ON candidate_experience
      FOR INSERT WITH CHECK (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_update'
  ) THEN
    CREATE POLICY candidate_experience_update ON candidate_experience
      FOR UPDATE USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_experience' AND policyname = 'candidate_experience_delete'
  ) THEN
    CREATE POLICY candidate_experience_delete ON candidate_experience
      FOR DELETE USING (
        candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_candidate_profiles_updated_at' AND c.relname = 'candidate_profiles'
  ) THEN
    CREATE TRIGGER update_candidate_profiles_updated_at
      BEFORE UPDATE ON candidate_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_candidate_education_updated_at' AND c.relname = 'candidate_education'
  ) THEN
    CREATE TRIGGER update_candidate_education_updated_at
      BEFORE UPDATE ON candidate_education
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_candidate_experience_updated_at' AND c.relname = 'candidate_experience'
  ) THEN
    CREATE TRIGGER update_candidate_experience_updated_at
      BEFORE UPDATE ON candidate_experience
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

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
