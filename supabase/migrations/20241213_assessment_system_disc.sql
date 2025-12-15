-- Migration: Assessment System (DISC)
-- Created: 2024-12-13
-- Description: Tables for assessment system with DISC personality test

-- Assessment types enum
CREATE TYPE assessment_type AS ENUM ('disc', 'mbti', 'big_five', 'technical', 'custom');

-- Assessment status enum
CREATE TYPE assessment_status AS ENUM ('draft', 'in_progress', 'completed', 'reviewed');

-- DISC profile types
CREATE TYPE disc_profile AS ENUM ('D', 'I', 'S', 'C', 'DD', 'DI', 'DS', 'DC', 'ID', 'II', 'IS', 'IC', 'SD', 'SI', 'SS', 'SC', 'CD', 'CI', 'CS', 'CC');

-- Main assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type assessment_type NOT NULL,
  status assessment_status DEFAULT 'draft',
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INT,
  
  -- Results summary
  raw_score JSONB, -- Raw answers/scores
  interpreted_score JSONB, -- Processed results
  insights TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessments_candidate_idx ON assessments(candidate_id);
CREATE INDEX IF NOT EXISTS assessments_user_idx ON assessments(candidate_user_id);
CREATE INDEX IF NOT EXISTS assessments_type_idx ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS assessments_status_idx ON assessments(status);

-- DISC Assessment - Detailed results
CREATE TABLE IF NOT EXISTS disc_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
  
  -- DISC Scores (0-100)
  dominance_score INT CHECK (dominance_score >= 0 AND dominance_score <= 100),
  influence_score INT CHECK (influence_score >= 0 AND influence_score <= 100),
  steadiness_score INT CHECK (steadiness_score >= 0 AND steadiness_score <= 100),
  conscientiousness_score INT CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 100),
  
  -- Primary and Secondary profiles
  primary_profile disc_profile,
  secondary_profile disc_profile,
  
  -- Interpretations
  description TEXT,
  strengths TEXT[],
  challenges TEXT[],
  work_style TEXT,
  communication_style TEXT,
  decision_making_style TEXT,
  
  -- Under pressure behavior
  under_pressure_behavior TEXT,
  ideal_environment TEXT,
  
  -- Career insights
  suitable_roles TEXT[],
  team_dynamics TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS disc_assessments_assessment_idx ON disc_assessments(assessment_id);

-- DISC Questions table (the actual questions)
CREATE TABLE IF NOT EXISTS disc_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INT NOT NULL,
  description TEXT NOT NULL,
  
  -- Four response options (D, I, S, C styles)
  option_d TEXT NOT NULL, -- Dominance
  option_i TEXT NOT NULL, -- Influence
  option_s TEXT NOT NULL, -- Steadiness
  option_c TEXT NOT NULL, -- Conscientiousness
  
  category TEXT, -- Optional: grouping of questions
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS disc_questions_number_idx ON disc_questions(question_number);

-- DISC Responses - user answers during the assessment
CREATE TABLE IF NOT EXISTS disc_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES disc_questions(id) ON DELETE CASCADE,
  
  -- Response (which profile the user selected: D, I, S, or C)
  selected_option CHAR(1) NOT NULL CHECK (selected_option IN ('D', 'I', 'S', 'C')),
  
  -- Ranking if applicable (1-4 order of preference)
  ranking INT,
  
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);

CREATE INDEX IF NOT EXISTS disc_responses_assessment_idx ON disc_responses(assessment_id);
CREATE INDEX IF NOT EXISTS disc_responses_question_idx ON disc_responses(question_id);

-- Assessment invitations (recruiter sends assessment to candidate)
CREATE TABLE IF NOT EXISTS assessment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_to_email TEXT NOT NULL,
  
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  
  -- Token for public link (candidate can access without auth)
  token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessment_invitations_assessment_idx ON assessment_invitations(assessment_id);
CREATE INDEX IF NOT EXISTS assessment_invitations_token_idx ON assessment_invitations(token);

-- RLS Policies
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Assessments RLS
CREATE POLICY "Candidates can view own assessments" ON assessments
  FOR SELECT USING (candidate_user_id = auth.uid());

CREATE POLICY "Candidates can update own assessments" ON assessments
  FOR UPDATE USING (candidate_user_id = auth.uid());

CREATE POLICY "Recruiters can view assessments for their candidates" ON assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates c 
      JOIN organizations org ON c.owner_org_id = org.id
      JOIN org_members om ON org.id = om.org_id
      WHERE c.id = assessments.candidate_id AND om.user_id = auth.uid()
    )
  );

-- DISC Assessments RLS
CREATE POLICY "Users can view own DISC results" ON disc_assessments
  FOR SELECT USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE candidate_user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view DISC results" ON disc_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = disc_assessments.assessment_id AND
      EXISTS (
        SELECT 1 FROM candidates c 
        JOIN organizations org ON c.owner_org_id = org.id
        JOIN org_members om ON org.id = om.org_id
        WHERE c.id = a.candidate_id AND om.user_id = auth.uid()
      )
    )
  );

-- DISC Questions RLS (public read)
CREATE POLICY "Anyone can read DISC questions" ON disc_questions
  FOR SELECT USING (active = TRUE);

-- DISC Responses RLS
CREATE POLICY "Candidates can create own responses" ON disc_responses
  FOR INSERT WITH CHECK (
    assessment_id IN (
      SELECT id FROM assessments WHERE candidate_user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can read own responses" ON disc_responses
  FOR SELECT USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE candidate_user_id = auth.uid()
    )
  );

-- Assessment Invitations RLS
CREATE POLICY "Recruiters can manage invitations" ON assessment_invitations
  FOR ALL USING (invited_by = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disc_assessments_updated_at
  BEFORE UPDATE ON disc_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disc_questions_updated_at
  BEFORE UPDATE ON disc_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial DISC questions (24 classic DISC questions)
INSERT INTO disc_questions (question_number, description, option_d, option_i, option_s, option_c) VALUES
(1, 'Você é mais:', 'Ousado(a)', 'Entusiasmado(a)', 'Paciente', 'Preciso(a)'),
(2, 'Quando enfrentando problemas, você tende a:', 'Agir rapidamente', 'Buscar o envolvimento de outros', 'Pensar cuidadosamente', 'Analisar os detalhes'),
(3, 'No trabalho você é conhecido por ser:', 'Direto(a) e decisivo(a)', 'Sociável e carismático(a)', 'Confiável e dedicado(a)', 'Preciso(a) e atento(a)'),
(4, 'Você prefere ambientes que são:', 'Desafiadores e competitivos', 'Sociais e colaborativos', 'Estáveis e previsíveis', 'Organizados e estruturados'),
(5, 'Suas maiores forças incluem:', 'Liderança e iniciativa', 'Comunicação e persuasão', 'Lealdade e paciência', 'Atenção aos detalhes'),
(6, 'Quando trabalha em equipe, você é o(a) que:', 'Toma as decisões', 'Motiva e inspira', 'Apoia e coopera', 'Garante a qualidade'),
(7, 'Você se sente mais motivado(a) por:', 'Resultados e vitória', 'Reconhecimento e admiração', 'Harmonia e apreciação', 'Excelência e precisão'),
(8, 'Diante de conflito, você tende a:', 'Confrontar diretamente', 'Tentar harmonizar', 'Evitar e ceder', 'Resolver com fatos'),
(9, 'Para você, o trabalho ideal seria:', 'Posição de poder e controle', 'Trabalho com muitas interações', 'Ambiente tranquilo e consistente', 'Trabalho tecnicamente desafiador'),
(10, 'Você é frequentemente descrito como:', 'Competitivo(a)', 'Animado(a)', 'Confiável', 'Cauteloso(a)'),
(11, 'Seu estilo de comunicação é:', 'Direto e objetivo', 'Entusiasmado e expressivo', 'Calmo e ouvinte', 'Lógico e fundamentado'),
(12, 'Você aprende melhor:', 'Fazendo e experimentando', 'Através de discussões e diálogos', 'Observando e praticando', 'Estudando e analisando'),
(13, 'Na situação de pressão, você:', 'Toma decisões rápidas', 'Busca apoio dos outros', 'Mantém a calma', 'Verifica todos os detalhes'),
(14, 'Você tende a focar em:', 'Objetivos e resultados', 'Relacionamentos', 'Processo e métodos', 'Qualidade e padrões'),
(15, 'Como colega, você é visto como:', 'Líder natural', 'Amigável e divertido', 'Dedicado e consistente', 'Profissional e correto'),
(16, 'Você se sente desconfortável quando:', 'Perde o controle', 'Está sozinho(a)', 'As coisas mudam repentinamente', 'Há falta de informação'),
(17, 'Seu feedback preferido é:', 'Honesto e direto', 'Reconhecimento público', 'Privado e encrajador', 'Detalhado e construtivo'),
(18, 'Você valoriza em um líder:', 'Força e visão', 'Carisma e inspiração', 'Apoio e compreensão', 'Competência e conhecimento'),
(19, 'Para crescer na carreira, você precisa de:', 'Desafios maiores', 'Visibilidade e status', 'Segurança e estabilidade', 'Desenvolvimento de habilidades'),
(20, 'Seus colegas vêm a você quando precisam:', 'De alguém para tomar ação', 'De motivação e apoio', 'De estabilidade e confiança', 'De análise e soluções'),
(21, 'Você se adapta melhor quando:', 'Tem liberdade de ação', 'Há pessoas envolvidas', 'Há tempo para preparação', 'Há clareza e procedimentos'),
(22, 'Sua abordagem de tarefas é:', 'Rápida e delegada', 'Colaborativa e entusiasmada', 'Metódica e consistente', 'Thoroughly analisada'),
(23, 'Você prospera em um ambiente que oferece:', 'Oportunidades de liderança', 'Diversidade e novidade', 'Previsibilidade e paz', 'Ordem e excelência'),
(24, 'Quando comete um erro, você:', 'Move para frente rapidamente', 'Pede desculpas e se foca em relacionamentos', 'Fica desapontado(a) consigo mesmo(a)', 'Analisa e aprende a lição')
ON CONFLICT DO NOTHING;
