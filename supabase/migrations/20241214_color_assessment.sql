-- Migration: Color Assessment System (5 Dinâmicas Humanas)
-- Created: 2024-12-14
-- Description: Tabelas e RLS para o Teste das Cores (Azul, Rosa, Amarelo, Verde, Branco) independentes do DISC

-- Enum para cores
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'color_choice') THEN
    CREATE TYPE color_choice AS ENUM ('azul', 'rosa', 'amarelo', 'verde', 'branco');
  END IF;
END $$;

-- Perguntas do teste das cores
CREATE TABLE IF NOT EXISTS color_questions (
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

-- Assessments do teste das cores
CREATE TABLE IF NOT EXISTS color_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  primary_color color_choice,
  secondary_color color_choice,
  scores JSONB, -- { azul, rosa, amarelo, verde, branco }
  UNIQUE (id, candidate_user_id)
);

CREATE INDEX IF NOT EXISTS color_assessments_user_idx ON color_assessments(candidate_user_id);

-- Respostas do teste das cores
CREATE TABLE IF NOT EXISTS color_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES color_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES color_questions(id) ON DELETE CASCADE,
  selected_color color_choice NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);

CREATE INDEX IF NOT EXISTS color_responses_assessment_idx ON color_responses(assessment_id);
CREATE INDEX IF NOT EXISTS color_responses_question_idx ON color_responses(question_id);

-- RLS
ALTER TABLE color_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_responses ENABLE ROW LEVEL SECURITY;

-- Policies: leitura pública autenticada das perguntas
CREATE POLICY color_questions_read_authenticated
  ON color_questions
  FOR SELECT
  TO authenticated
  USING (active = TRUE);

-- Policies: o próprio usuário pode gerenciar seus assessments
CREATE POLICY color_assessments_self_select
  ON color_assessments
  FOR SELECT
  TO authenticated
  USING (candidate_user_id = auth.uid());

CREATE POLICY color_assessments_self_insert
  ON color_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (candidate_user_id = auth.uid());

CREATE POLICY color_assessments_self_update
  ON color_assessments
  FOR UPDATE
  TO authenticated
  USING (candidate_user_id = auth.uid())
  WITH CHECK (candidate_user_id = auth.uid());

-- Policies: respostas vinculadas a assessments do próprio usuário
CREATE POLICY color_responses_self_select
  ON color_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM color_assessments ca
      WHERE ca.id = color_responses.assessment_id
        AND ca.candidate_user_id = auth.uid()
    )
  );

CREATE POLICY color_responses_self_insert
  ON color_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM color_assessments ca
      WHERE ca.id = assessment_id
        AND ca.candidate_user_id = auth.uid()
    )
  );

CREATE POLICY color_responses_self_update
  ON color_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM color_assessments ca
      WHERE ca.id = color_responses.assessment_id
        AND ca.candidate_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM color_assessments ca
      WHERE ca.id = color_responses.assessment_id
        AND ca.candidate_user_id = auth.uid()
    )
  );
