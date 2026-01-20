-- ============================================================================
-- TALENTFORGE - SETUP COMPLETO SUPABASE
-- ============================================================================
-- Este arquivo contém TODAS as tabelas, tipos, funções, triggers e políticas
-- necessárias para criar o projeto TalentForge em um novo Supabase.
-- 
-- INSTRUÇÕES:
-- 1. Acesse seu novo projeto Supabase
-- 2. Vá em SQL Editor
-- 3. Copie e execute este arquivo completo
-- 4. Execute o arquivo de SEED separado para dados iniciais
-- ============================================================================

-- ============================================================================
-- PARTE 1: TIPOS ENUMERADOS (ENUMS)
-- ============================================================================

CREATE TYPE org_type AS ENUM ('headhunter', 'company');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
CREATE TYPE seniority_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'director', 'executive');
CREATE TYPE application_status AS ENUM ('applied', 'in_process', 'hired', 'rejected');
CREATE TYPE assessment_kind AS ENUM ('behavioral_v1');
CREATE TYPE user_type AS ENUM ('recruiter', 'candidate', 'admin');
CREATE TYPE assessment_type AS ENUM ('disc', 'mbti', 'big_five', 'technical', 'custom', 'color', 'pi');
CREATE TYPE assessment_status AS ENUM ('draft', 'in_progress', 'completed', 'reviewed');
CREATE TYPE disc_profile AS ENUM ('D', 'I', 'S', 'C', 'DD', 'DI', 'DS', 'DC', 'ID', 'II', 'IS', 'IC', 'SD', 'SI', 'SS', 'SC', 'CD', 'CI', 'CS', 'CC');
CREATE TYPE color_choice AS ENUM ('azul', 'rosa', 'amarelo', 'verde', 'branco');
CREATE TYPE pi_axis AS ENUM ('direcao', 'energia_social', 'ritmo', 'estrutura');
CREATE TYPE pi_block AS ENUM ('natural', 'adaptado');

-- ============================================================================
-- PARTE 2: TABELAS PRINCIPAIS (CORE)
-- ============================================================================

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_type org_type NOT NULL,
  slug TEXT GENERATED ALWAYS AS (regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

-- User Profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  user_type user_type DEFAULT 'candidate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  current_title TEXT,
  linkedin_url TEXT,
  salary_expectation NUMERIC,
  availability_date DATE,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX candidates_owner_idx ON candidates(owner_org_id);
CREATE INDEX candidates_email_idx ON candidates(email);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  employment_type employment_type,
  seniority seniority_level,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'on_hold', 'closed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX jobs_org_idx ON jobs(org_id);
CREATE INDEX jobs_status_idx ON jobs(status);

-- Pipeline Stages
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, position)
);

CREATE INDEX pipeline_stages_job_idx ON pipeline_stages(job_id);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  current_stage_id UUID REFERENCES pipeline_stages(id),
  status application_status NOT NULL DEFAULT 'applied',
  score NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

CREATE INDEX applications_job_idx ON applications(job_id);
CREATE INDEX applications_candidate_idx ON applications(candidate_id);
CREATE INDEX applications_status_idx ON applications(status);

-- Application Events
CREATE TABLE application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id),
  to_stage_id UUID REFERENCES pipeline_stages(id),
  status application_status,
  note TEXT,
  actor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX application_events_app_idx ON application_events(application_id);

-- Candidate Notes
CREATE TABLE candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX candidate_notes_candidate_idx ON candidate_notes(candidate_id);

-- ============================================================================
-- PARTE 3: CANDIDATE PROFILES (Perfil completo do candidato)
-- ============================================================================

CREATE TABLE candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  full_name TEXT,
  cpf TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  city TEXT,
  state TEXT,
  
  -- Dados profissionais
  current_title TEXT,
  area_of_expertise TEXT,
  seniority_level TEXT CHECK (seniority_level IN ('estagiario', 'junior', 'pleno', 'senior', 'lead', 'gerente', 'diretor', 'c-level')),
  salary_expectation NUMERIC,
  employment_type TEXT[] DEFAULT '{}',
  
  -- Resume/CV
  resume_url TEXT,
  resume_filename TEXT,
  
  -- Profile status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 1,
  profile_completion_percentage INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX candidate_profiles_user_idx ON candidate_profiles(user_id);
CREATE INDEX candidate_profiles_cpf_idx ON candidate_profiles(cpf);

-- Education
CREATE TABLE candidate_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  degree_level TEXT NOT NULL CHECK (degree_level IN ('ensino_fundamental', 'ensino_medio', 'tecnico', 'graduacao', 'pos_graduacao', 'mestrado', 'doutorado', 'mba')),
  course_name TEXT NOT NULL,
  institution TEXT NOT NULL,
  start_year INT,
  end_year INT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX candidate_education_profile_idx ON candidate_education(candidate_profile_id);

-- Experience
CREATE TABLE candidate_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX candidate_experience_profile_idx ON candidate_experience(candidate_profile_id);

-- ============================================================================
-- PARTE 4: ASSESSMENTS (Sistema de avaliações)
-- ============================================================================

-- Main Assessments
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type assessment_type NOT NULL,
  status assessment_status DEFAULT 'draft',
  title TEXT NOT NULL,
  description TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INT,
  raw_score JSONB,
  interpreted_score JSONB,
  insights TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX assessments_candidate_idx ON assessments(candidate_id);
CREATE INDEX assessments_user_idx ON assessments(candidate_user_id);
CREATE INDEX assessments_type_idx ON assessments(assessment_type);
CREATE INDEX assessments_status_idx ON assessments(status);

-- ============================================================================
-- PARTE 5: DISC ASSESSMENT (Teste DISC)
-- ============================================================================

CREATE TABLE disc_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
  dominance_score INT CHECK (dominance_score >= 0 AND dominance_score <= 100),
  influence_score INT CHECK (influence_score >= 0 AND influence_score <= 100),
  steadiness_score INT CHECK (steadiness_score >= 0 AND steadiness_score <= 100),
  conscientiousness_score INT CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 100),
  primary_profile disc_profile,
  secondary_profile disc_profile,
  description TEXT,
  strengths TEXT[],
  challenges TEXT[],
  work_style TEXT,
  communication_style TEXT,
  decision_making_style TEXT,
  under_pressure_behavior TEXT,
  ideal_environment TEXT,
  suitable_roles TEXT[],
  team_dynamics TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX disc_assessments_assessment_idx ON disc_assessments(assessment_id);

CREATE TABLE disc_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INT NOT NULL,
  description TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_i TEXT NOT NULL,
  option_s TEXT NOT NULL,
  option_c TEXT NOT NULL,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX disc_questions_number_idx ON disc_questions(question_number);

CREATE TABLE disc_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES disc_questions(id) ON DELETE CASCADE,
  selected_option CHAR(1) NOT NULL CHECK (selected_option IN ('D', 'I', 'S', 'C')),
  ranking INT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);

CREATE INDEX disc_responses_assessment_idx ON disc_responses(assessment_id);
CREATE INDEX disc_responses_question_idx ON disc_responses(question_id);

-- ============================================================================
-- PARTE 6: COLOR ASSESSMENT (Teste das 5 Cores)
-- ============================================================================

CREATE TABLE color_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INT NOT NULL,
  prompt TEXT NOT NULL,
  option_azul TEXT NOT NULL,
  option_rosa TEXT NOT NULL,
  option_amarelo TEXT NOT NULL,
  option_verde TEXT NOT NULL,
  option_branco TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (question_number)
);

CREATE TABLE color_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  primary_color color_choice,
  secondary_color color_choice,
  scores JSONB,
  UNIQUE (id, candidate_user_id)
);

CREATE INDEX color_assessments_user_idx ON color_assessments(candidate_user_id);

CREATE TABLE color_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES color_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES color_questions(id) ON DELETE CASCADE,
  selected_color color_choice NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);

CREATE INDEX color_responses_assessment_idx ON color_responses(assessment_id);
CREATE INDEX color_responses_question_idx ON color_responses(question_id);

-- ============================================================================
-- PARTE 7: PI ASSESSMENT (Perfil Comportamental)
-- ============================================================================

CREATE TABLE pi_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  scores_natural JSONB,
  scores_adapted JSONB,
  gaps JSONB
);

CREATE INDEX pi_assessments_user_idx ON pi_assessments(candidate_user_id);

CREATE TABLE pi_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descriptor TEXT NOT NULL,
  axis pi_axis NOT NULL,
  position INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (descriptor)
);

CREATE TABLE pi_situational_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INT NOT NULL,
  prompt TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_a_axis pi_axis NOT NULL,
  option_b_axis pi_axis NOT NULL,
  option_c_axis pi_axis NOT NULL,
  option_d_axis pi_axis NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (question_number)
);

CREATE TABLE pi_descriptor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES pi_assessments(id) ON DELETE CASCADE,
  descriptor_id UUID NOT NULL REFERENCES pi_descriptors(id) ON DELETE CASCADE,
  block pi_block NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, descriptor_id, block)
);

CREATE INDEX pi_descriptor_responses_assessment_idx ON pi_descriptor_responses(assessment_id);

CREATE TABLE pi_situational_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES pi_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pi_situational_questions(id) ON DELETE CASCADE,
  block pi_block NOT NULL,
  selected_axis pi_axis NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id, block)
);

CREATE INDEX pi_situational_responses_assessment_idx ON pi_situational_responses(assessment_id);

-- ============================================================================
-- PARTE 8: ASSESSMENT INVITATIONS
-- ============================================================================

CREATE TABLE assessment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_to_email TEXT NOT NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX assessment_invitations_assessment_idx ON assessment_invitations(assessment_id);
CREATE INDEX assessment_invitations_token_idx ON assessment_invitations(token);

-- ============================================================================
-- PARTE 9: FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função: atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: verificar se é membro da organização
CREATE OR REPLACE FUNCTION is_org_member(org UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org AND om.user_id = auth.uid()
  );
$$;

-- Função: criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'candidate')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers: updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_education_updated_at BEFORE UPDATE ON candidate_education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_experience_updated_at BEFORE UPDATE ON candidate_experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disc_assessments_updated_at BEFORE UPDATE ON disc_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disc_questions_updated_at BEFORE UPDATE ON disc_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 10: RLS (Row Level Security) - HABILITAR
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_situational_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_descriptor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pi_situational_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 11: RLS POLICIES - ORGANIZATIONS
-- ============================================================================

CREATE POLICY orgs_select ON organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY orgs_insert ON organizations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY orgs_update ON organizations FOR UPDATE USING (is_org_member(id));

CREATE POLICY org_members_select ON org_members FOR SELECT USING (user_id = auth.uid() OR is_org_member(org_id));
CREATE POLICY org_members_insert ON org_members FOR INSERT WITH CHECK (is_org_member(org_id));
CREATE POLICY org_members_update ON org_members FOR UPDATE USING (is_org_member(org_id));
CREATE POLICY org_members_delete ON org_members FOR DELETE USING (is_org_member(org_id));

-- ============================================================================
-- PARTE 12: RLS POLICIES - USER PROFILES
-- ============================================================================

CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- PARTE 13: RLS POLICIES - CANDIDATES & JOBS
-- ============================================================================

CREATE POLICY candidates_rw ON candidates FOR ALL USING (is_org_member(owner_org_id)) WITH CHECK (is_org_member(owner_org_id));
CREATE POLICY jobs_rw ON jobs FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));

CREATE POLICY pipeline_rw ON pipeline_stages FOR ALL 
  USING (is_org_member((SELECT org_id FROM jobs j WHERE j.id = pipeline_stages.job_id)))
  WITH CHECK (is_org_member((SELECT org_id FROM jobs j WHERE j.id = pipeline_stages.job_id)));

CREATE POLICY applications_rw ON applications FOR ALL 
  USING (is_org_member((SELECT org_id FROM jobs j WHERE j.id = applications.job_id)))
  WITH CHECK (is_org_member((SELECT org_id FROM jobs j WHERE j.id = applications.job_id)));

CREATE POLICY application_events_rw ON application_events FOR ALL 
  USING (is_org_member((SELECT org_id FROM jobs j JOIN applications a ON a.job_id = j.id WHERE a.id = application_events.application_id)))
  WITH CHECK (is_org_member((SELECT org_id FROM jobs j JOIN applications a ON a.job_id = j.id WHERE a.id = application_events.application_id)));

CREATE POLICY candidate_notes_rw ON candidate_notes FOR ALL 
  USING (is_org_member((SELECT owner_org_id FROM candidates c WHERE c.id = candidate_notes.candidate_id)))
  WITH CHECK (is_org_member((SELECT owner_org_id FROM candidates c WHERE c.id = candidate_notes.candidate_id)));

-- ============================================================================
-- PARTE 14: RLS POLICIES - CANDIDATE PROFILES
-- ============================================================================

CREATE POLICY candidate_profiles_select ON candidate_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY candidate_profiles_insert ON candidate_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY candidate_profiles_update ON candidate_profiles FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY candidate_education_select ON candidate_education FOR SELECT 
  USING (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));
CREATE POLICY candidate_education_insert ON candidate_education FOR INSERT 
  WITH CHECK (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));
CREATE POLICY candidate_education_update ON candidate_education FOR UPDATE 
  USING (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));
CREATE POLICY candidate_education_delete ON candidate_education FOR DELETE 
  USING (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));

CREATE POLICY candidate_experience_select ON candidate_experience FOR SELECT 
  USING (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));
CREATE POLICY candidate_experience_insert ON candidate_experience FOR INSERT 
  WITH CHECK (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));
CREATE POLICY candidate_experience_update ON candidate_experience FOR UPDATE 
  USING (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));
CREATE POLICY candidate_experience_delete ON candidate_experience FOR DELETE 
  USING (candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- PARTE 15: RLS POLICIES - ASSESSMENTS
-- ============================================================================

CREATE POLICY assessments_candidates_view ON assessments FOR SELECT USING (candidate_user_id = auth.uid());
CREATE POLICY assessments_candidates_update ON assessments FOR UPDATE USING (candidate_user_id = auth.uid());

CREATE POLICY assessments_recruiters_view ON assessments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM candidates c 
    JOIN organizations org ON c.owner_org_id = org.id
    JOIN org_members om ON org.id = om.org_id
    WHERE c.id = assessments.candidate_id AND om.user_id = auth.uid()
  )
);

-- ============================================================================
-- PARTE 16: RLS POLICIES - DISC
-- ============================================================================

CREATE POLICY disc_assessments_own ON disc_assessments FOR SELECT 
  USING (assessment_id IN (SELECT id FROM assessments WHERE candidate_user_id = auth.uid()));

CREATE POLICY disc_assessments_recruiters ON disc_assessments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM assessments a
    WHERE a.id = disc_assessments.assessment_id AND EXISTS (
      SELECT 1 FROM candidates c 
      JOIN organizations org ON c.owner_org_id = org.id
      JOIN org_members om ON org.id = om.org_id
      WHERE c.id = a.candidate_id AND om.user_id = auth.uid()
    )
  )
);

CREATE POLICY disc_questions_read ON disc_questions FOR SELECT USING (active = TRUE);

CREATE POLICY disc_responses_create ON disc_responses FOR INSERT 
  WITH CHECK (assessment_id IN (SELECT id FROM assessments WHERE candidate_user_id = auth.uid()));
CREATE POLICY disc_responses_read ON disc_responses FOR SELECT 
  USING (assessment_id IN (SELECT id FROM assessments WHERE candidate_user_id = auth.uid()));

-- ============================================================================
-- PARTE 17: RLS POLICIES - COLOR
-- ============================================================================

CREATE POLICY color_questions_read ON color_questions FOR SELECT TO authenticated USING (active = TRUE);
CREATE POLICY color_assessments_self_select ON color_assessments FOR SELECT TO authenticated USING (candidate_user_id = auth.uid());
CREATE POLICY color_assessments_self_insert ON color_assessments FOR INSERT TO authenticated WITH CHECK (candidate_user_id = auth.uid());
CREATE POLICY color_assessments_self_update ON color_assessments FOR UPDATE TO authenticated USING (candidate_user_id = auth.uid()) WITH CHECK (candidate_user_id = auth.uid());

CREATE POLICY color_responses_self_select ON color_responses FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM color_assessments ca WHERE ca.id = color_responses.assessment_id AND ca.candidate_user_id = auth.uid()));
CREATE POLICY color_responses_self_insert ON color_responses FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM color_assessments ca WHERE ca.id = assessment_id AND ca.candidate_user_id = auth.uid()));
CREATE POLICY color_responses_self_update ON color_responses FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM color_assessments ca WHERE ca.id = color_responses.assessment_id AND ca.candidate_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM color_assessments ca WHERE ca.id = color_responses.assessment_id AND ca.candidate_user_id = auth.uid()));

-- ============================================================================
-- PARTE 18: RLS POLICIES - PI
-- ============================================================================

CREATE POLICY pi_descriptors_read ON pi_descriptors FOR SELECT TO authenticated USING (active = TRUE);
CREATE POLICY pi_situational_questions_read ON pi_situational_questions FOR SELECT TO authenticated USING (active = TRUE);

CREATE POLICY pi_assessments_self_select ON pi_assessments FOR SELECT TO authenticated USING (candidate_user_id = auth.uid());
CREATE POLICY pi_assessments_self_insert ON pi_assessments FOR INSERT TO authenticated WITH CHECK (candidate_user_id = auth.uid());
CREATE POLICY pi_assessments_self_update ON pi_assessments FOR UPDATE TO authenticated USING (candidate_user_id = auth.uid()) WITH CHECK (candidate_user_id = auth.uid());

CREATE POLICY pi_descriptor_responses_self_select ON pi_descriptor_responses FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = pi_descriptor_responses.assessment_id AND pa.candidate_user_id = auth.uid()));
CREATE POLICY pi_descriptor_responses_self_insert ON pi_descriptor_responses FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = assessment_id AND pa.candidate_user_id = auth.uid()));
CREATE POLICY pi_descriptor_responses_self_update ON pi_descriptor_responses FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = pi_descriptor_responses.assessment_id AND pa.candidate_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = pi_descriptor_responses.assessment_id AND pa.candidate_user_id = auth.uid()));

CREATE POLICY pi_situational_responses_self_select ON pi_situational_responses FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = pi_situational_responses.assessment_id AND pa.candidate_user_id = auth.uid()));
CREATE POLICY pi_situational_responses_self_insert ON pi_situational_responses FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = assessment_id AND pa.candidate_user_id = auth.uid()));
CREATE POLICY pi_situational_responses_self_update ON pi_situational_responses FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = pi_situational_responses.assessment_id AND pa.candidate_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pi_assessments pa WHERE pa.id = pi_situational_responses.assessment_id AND pa.candidate_user_id = auth.uid()));

-- ============================================================================
-- PARTE 19: RLS POLICIES - INVITATIONS
-- ============================================================================

CREATE POLICY assessment_invitations_manage ON assessment_invitations FOR ALL USING (invited_by = auth.uid());

-- ============================================================================
-- FIM DO SETUP - Execute o arquivo de SEED separadamente
-- ============================================================================
